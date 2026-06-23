import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  ArrowLeft, 
  Download, 
  ShieldCheck,
  Calendar,
  Layers,
  Code2,
  Play,
  Loader2,
  Clock,
  MessageSquare,
  Send,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X
} from 'lucide-react';
import { supabase } from '../supabase'; 
import { Game } from '../types/game';

// Helper per convertire i link di YouTube nel formato embed corretto con suggerimento HD (1080p)
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    const videoId = match[2];
    // Forziamo il caricamento in HD (hd1080) e rimuoviamo i video correlati alla fine (rel=0)
    return `https://www.youtube.com/embed/${videoId}?vq=hd1080&rel=0`;
  }
  return null;
};

// Helper per estrarre la copertina ufficiale del video da YouTube per le miniature del carousel
const getYouTubeThumbnail = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
  }
  return null;
};

const GameDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true); 

  // Stati per il Carousel di Steam
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  // Stato per nascondere il cursore e l'interfaccia nel lightbox dopo inattività
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stati per la gestione dei commenti
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchComments = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('game_id', parseInt(id, 10))
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Errore nel recupero dei commenti:", error);
    } else if (data) {
      setComments(data);
    }
  };

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', parseInt(id, 10)) 
        .single(); 

      if (error) {
        console.error("Errore nel recupero del dettaglio:", error);
        setGame(null);
      } else if (data) {
        const targetDateStr = data.release_date || data.created_at;
        const formattedReleaseDate = targetDateStr 
          ? new Date(targetDateStr).toLocaleDateString('it-IT', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : 'Data non disponibile';

        const mappedGame: Game = {
          id: data.id.toString(),
          title: data.title || '',
          description: data.description || '',
          developer: data.developer || '',
          pearcryptLink: data.pearcrypt_url || '',
          bannerImage: data.banner_url || '',
          videoUrl: data.video_url || '',
          steamScreenshots: data.screenshots || [], 
          isUpcoming: data.is_upcoming || false, 
          steamUrl: data.steam_url || '', 
          gogUrl: data.gog_url || '',
          epicUrl: data.epic_url || '',
          tags: ['New'],
          genres: [],
          platforms: ['windows'],
          releaseDate: formattedReleaseDate,
        };
        setGame(mappedGame);

        // Costruiamo la lista dei media unendo video e screenshot per il Carousel
        const items = [];
        if (mappedGame.videoUrl) {
          items.push({ type: 'video', url: mappedGame.videoUrl });
        }
        if (mappedGame.steamScreenshots && mappedGame.steamScreenshots.length > 0) {
          mappedGame.steamScreenshots.forEach(imgUrl => {
            items.push({ type: 'image', url: imgUrl });
          });
        }
        if (items.length === 0) {
          items.push({ type: 'image', url: mappedGame.bannerImage });
        }
        setMediaItems(items);
        setActiveIndex(0);
      }
      setLoading(false);
    };

    const userStr = localStorage.getItem('ares_discord_user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    fetchGameDetails();
    fetchComments(); 
    window.scrollTo(0, 0);
  }, [id]);

  const handlePrevMedia = () => {
    setActiveIndex(prev => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleNextMedia = () => {
    setActiveIndex(prev => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const handleFullscreenPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenIndex(prev => (prev === null || prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleFullscreenNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenIndex(prev => (prev === null || prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullscreenIndex !== null) {
        if (e.key === 'ArrowLeft') {
          setFullscreenIndex(prev => (prev === null || prev === 0 ? mediaItems.length - 1 : prev - 1));
        } else if (e.key === 'ArrowRight') {
          setFullscreenIndex(prev => (prev === null || prev === mediaItems.length - 1 ? 0 : prev + 1));
        } else if (e.key === 'Escape') {
          setFullscreenIndex(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenIndex, mediaItems.length]);

  // Gestore unificato del movimento del mouse (Interaction Sensor)
  const handleMouseMove = () => {
    setShowCursor(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Nasconde il cursore e l'interfaccia dopo 2 secondi di inattività totale
    timeoutRef.current = setTimeout(() => {
      setShowCursor(false);
    }, 2000);
  };

  useEffect(() => {
    if (fullscreenIndex === null) {
      setShowCursor(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    window.addEventListener('mousemove', handleMouseMove);

    // Avvia il timer al primo ingresso in fullscreen
    timeoutRef.current = setTimeout(() => {
      setShowCursor(false);
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fullscreenIndex]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !id) return;
    setSubmittingComment(true);
    const { error } = await supabase
      .from('comments')
      .insert([
        {
          game_id: parseInt(id, 10),
          username: currentUser.globalName || currentUser.username,
          avatar_url: currentUser.avatar,
          comment_text: newComment.trim()
        }
      ]);
    if (error) {
      console.error("Errore durante l'invio del commento:", error);
      alert("Errore nell'invio del commento. Riprova!");
    } else {
      setNewComment('');
      fetchComments(); 
    }
    setSubmittingComment(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-brand-azure animate-spin mb-4" />
        <p className="text-gray-400">Accessing secure archives...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        404 | Record Not Found
      </div>
    );
  }

  const activeMedia = mediaItems[activeIndex];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
      
      {/* BANNER DI SFONDO */}
      <div className="theme-preserve-contrast relative h-[65vh] min-h-[500px] border-b border-brand-border/60 overflow-hidden">
        <img src={game.bannerImage} className="w-full h-full object-cover animate-fade-in" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-16 z-10">
          <div className="container mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-brand-azure font-bold mb-8 hover:translate-x-[-4px] transition-transform drop-shadow-lg">
              <ArrowLeft className="w-4 h-4" />
              BACK TO DATABASE
            </Link>
            <h1 className="text-6xl md:text-9xl font-black text-white mb-6 tracking-tighter uppercase italic leading-none drop-shadow-2xl">
              {game.title}
            </h1>
            <div className="flex flex-wrap gap-3">
              {(game.tags || []).map(tag => (
                <span key={tag} className="px-5 py-2 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20 shadow-lg">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-16">
            
            {/* CAROUSEL */}
            {mediaItems.length > 0 && (
              <section className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                  <Layers className="w-6 h-6 text-brand-azure" />
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest">Media Gallery</h2>
                </div>
                <div className="aspect-video rounded-3xl overflow-hidden relative border border-brand-border shadow-2xl bg-black group">
                  <AnimatePresence mode="wait">
                    {activeMedia && activeMedia.type === 'video' ? (
                      (() => {
                        const embedUrl = getYouTubeEmbedUrl(activeMedia.url);
                        if (embedUrl) {
                          return (
                            <iframe
                              key={activeMedia.url}
                              src={embedUrl}
                              title={`${game.title} Trailer`}
                              className="w-full h-full border-0 rounded-3xl"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          );
                        }
                        return (
                          <video 
                            key={activeMedia.url}
                            src={activeMedia.url} 
                            controls 
                            autoPlay
                            muted
                            className="w-full h-full object-contain"
                          />
                        );
                      })()
                    ) : (
                      activeMedia && (
                        <motion.img 
                          key={activeMedia.url}
                          src={activeMedia.url} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full object-cover cursor-zoom-in" 
                          onClick={() => setFullscreenIndex(activeIndex)}
                          alt="Game Screenshot" 
                        />
                      )
                    )}
                  </AnimatePresence>
                  <button onClick={handlePrevMedia} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-brand-azure p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10 hover:scale-105">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={handleNextMedia} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-brand-azure p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10 hover:scale-105">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-brand-border scrollbar-track-transparent">
                  {mediaItems.map((item, index) => (
                    <div 
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      className={`w-28 aspect-video rounded-lg overflow-hidden border-2 cursor-pointer shrink-0 transition-all relative ${
                        activeIndex === index ? "border-brand-azure scale-95 opacity-100" : "border-brand-border opacity-50 hover:opacity-100 hover:border-gray-500"
                      }`}
                    >
                      <img src={item.type === 'video' ? (getYouTubeThumbnail(item.url) || game.bannerImage) : item.url} className="w-full h-full object-cover" alt="Thumb" />
                      {item.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Play className="w-6 h-6 text-brand-azure fill-brand-azure" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1.5 bg-brand-azure rounded-full" />
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Overview</h2>
              </div>
              <p className="text-xl leading-relaxed text-gray-400 font-medium max-w-3xl">
                {game.description}
              </p>
            </section>

            {/* COMMENTI */}
            <section className="pt-12 border-t border-brand-border">
              <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-widest flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-brand-azure" />
                Discussion & Reports ({comments.length})
              </h3>
              {currentUser ? (
                <form onSubmit={handleAddComment} className="flex gap-4 mb-10 bg-brand-card p-6 rounded-2xl border border-brand-border">
                  <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-brand-azure object-cover shrink-0" />
                  <div className="flex-1 space-y-3">
                    <textarea 
                      placeholder="Scrivi un commento o segnala un problema..."
                      required
                      rows={3}
                      className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-azure resize-none"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button type="submit" disabled={submittingComment || !newComment.trim()} className="px-5 py-2.5 bg-brand-azure hover:brightness-110 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50">
                        <Send className="w-3.5 h-3.5" />
                        {submittingComment ? 'Sending...' : 'Send Comment'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6 bg-brand-card/50 rounded-2xl border border-dashed border-brand-border mb-10">
                  <p className="text-gray-400 text-sm mb-3">Connettiti con Discord per commentare.</p>
                </div>
              )}
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-brand-card/30 p-5 rounded-2xl border border-brand-border/60 flex gap-4">
                    <img src={comment.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png"} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-black text-white">{comment.username}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{new Date(comment.created_at).toLocaleString('it-IT')}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{comment.comment_text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-8">
              <div className="bg-brand-card border border-brand-border rounded-[2.5rem] p-10 shadow-2xl">
                {game.isUpcoming ? (
                  <button disabled className="w-full py-6 bg-brand-border text-gray-500 font-black rounded-2xl flex items-center justify-center gap-3 text-lg border border-dashed border-gray-600">
                    <Clock className="w-6 h-6" />
                    COMING SOON
                  </button>
                ) : (
                  <a href={game.pearcryptLink} target="_blank" rel="noopener noreferrer" className="w-full py-6 bg-brand-azure hover:bg-brand-azure/90 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-azure/20 group text-lg">
                    <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                    DOWNLOAD NOW
                  </a>
                )}
                
                <div className="mt-12 space-y-8">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                    <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> {game.isUpcoming ? 'Expected' : 'Released'}</span>
                    <span className="text-white font-black">{game.releaseDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                    <span className="text-gray-500 flex items-center gap-2"><Code2 className="w-4 h-4" /> Developer</span>
                    <span className="text-white font-black">{game.developer}</span>
                  </div>

                  {/* LINK COMMERCIALI */}
                  <div className="pt-8 border-t border-brand-border space-y-3">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Support Developers</span>
                    {game.steamUrl && <a href={game.steamUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-[#1b2838] hover:bg-[#2a475e] text-[#66c0f4] text-xs font-black rounded-xl transition-all flex items-center justify-center uppercase tracking-wider">Buy on Steam</a>}
                    {game.gogUrl && <a href={game.gogUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-[#110d26] hover:bg-[#5c2e91] text-[#bf9cff] text-xs font-black rounded-xl transition-all flex items-center justify-center uppercase tracking-wider">Buy on GOG</a>}
                    {game.epicUrl && <a href={game.epicUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-[#191919] hover:bg-[#2a2a2a] text-[#f5f5f5] text-xs font-black rounded-xl transition-all flex items-center justify-center uppercase tracking-wider">Buy on Epic Store</a>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN MODAL CON SENSOR OVERLAY */}
      <AnimatePresence>
        {fullscreenIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setFullscreenIndex(null)} 
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col justify-center items-center p-4 select-none"
          >
            {/* Pulsante di chiusura (sfuma insieme al cursore) */}
            <button 
              onClick={() => setFullscreenIndex(null)} 
              className={`absolute top-6 right-6 text-gray-400 hover:text-white bg-white/5 p-3 rounded-full transition-all duration-300 z-50 ${
                showCursor ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative max-w-6xl w-full aspect-video flex items-center justify-center">
              {mediaItems[fullscreenIndex]?.type === 'video' ? (
                (() => {
                  const url = getYouTubeEmbedUrl(mediaItems[fullscreenIndex].url);
                  return url ? (
                    <div className="relative w-full h-full">
                      <iframe 
                        src={url} 
                        className="w-full h-full rounded-2xl max-h-[85vh] border-0" 
                        allowFullScreen 
                      />
                      {/* INTERACTION SENSOR OVERLAY PER YOUTUBE IFRAME */}
                      <div 
                        onMouseMove={handleMouseMove}
                        className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                          showCursor 
                            ? 'pointer-events-none bg-transparent' 
                            : 'pointer-events-auto bg-transparent cursor-none'
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video 
                        src={mediaItems[fullscreenIndex].url} 
                        controls 
                        autoPlay 
                        className="max-h-[85vh] rounded-2xl" 
                      />
                      {/* INTERACTION SENSOR OVERLAY PER VIDEO TAG */}
                      <div 
                        onMouseMove={handleMouseMove}
                        className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                          showCursor 
                            ? 'pointer-events-none bg-transparent' 
                            : 'pointer-events-auto bg-transparent cursor-none'
                        }`}
                      />
                    </div>
                  );
                })()
              ) : (
                <img src={mediaItems[fullscreenIndex]?.url} className="max-h-[85vh] rounded-2xl object-contain" alt="Fullscreen" />
              )}
              
              {/* Pulsanti di navigazione (sfumano insieme al cursore) */}
              <button 
                onClick={handleFullscreenPrev} 
                className={`absolute left-[-10px] md:left-[-60px] top-1/2 -translate-y-1/2 bg-white/5 p-4 rounded-full text-white transition-all duration-300 z-50 ${
                  showCursor ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button 
                onClick={handleFullscreenNext} 
                className={`absolute right-[-10px] md:right-[-60px] top-1/2 -translate-y-1/2 bg-white/5 p-4 rounded-full text-white transition-all duration-300 z-50 ${
                  showCursor ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Testo del conteggio media (sfuma insieme al cursore) */}
            <div className={`absolute bottom-6 text-gray-500 font-mono text-sm uppercase tracking-widest transition-all duration-300 ${
              showCursor ? 'opacity-100' : 'opacity-0'
            }`}>
              Media {fullscreenIndex + 1} of {mediaItems.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default GameDetails;