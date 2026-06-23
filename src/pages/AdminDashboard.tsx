import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShieldAlert, CheckCircle2, Video, Image as ImageIcon, X, Pencil, Save, Upload, Sparkles, LogOut } from 'lucide-react';
import { supabase } from '../supabase'; 
import { Game } from '../types/game';
import { Session } from '@supabase/supabase-js';

const emptyGame: Partial<Game> = {
  title: '',
  description: '',
  developer: '',
  buzzheavierLink: '', // Migrato a Buzzheavier
  bannerImage: '',
  steamScreenshots: [],
  videoUrl: '',
  releaseDate: '', 
  isUpcoming: false, 
  steamUrl: '',
  gogUrl: '',
  epicUrl: '',
  tags: [],
  genres: [],
  platforms: ['windows']
};

const AdminDashboard = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [screenshotInput, setScreenshotInput] = useState('');
  const [activeGame, setActiveGame] = useState<Partial<Game>>(emptyGame);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fetchingRawg, setFetchingRawg] = useState(false);

  // Controllo della sessione all'avvio
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchGames();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) resetForm();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Login con Supabase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert('Credenziali non valide: ' + error.message);
    }
  };

  // Logout tramite Supabase
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error("Errore nel caricamento dei giochi:", error);
    } else if (data) {
      const mappedGames: Game[] = data.map(dbGame => ({
        id: dbGame.id.toString(),
        title: dbGame.title || '',
        description: dbGame.description || '',
        developer: dbGame.developer || '',
        buzzheavierLink: dbGame.pearcrypt_url || '', // Mappato su pearcrypt_url nel DB per retrocompatibilità
        bannerImage: dbGame.banner_url || '',
        videoUrl: dbGame.video_url || '',
        steamScreenshots: dbGame.screenshots || [],
        releaseDate: dbGame.release_date || '', 
        isUpcoming: dbGame.is_upcoming || false, 
        steamUrl: dbGame.steam_url || '',
        gogUrl: dbGame.gog_url || '',
        epicUrl: dbGame.epic_url || '',
        tags: ['New'],
        genres: [],
        platforms: ['windows'],
      }));
      setGames(mappedGames);
    }
  };

  const handleFetchRawgData = async () => {
    const query = activeGame.title?.trim();
    if (!query) {
      alert("Scrivi prima il titolo del gioco nel campo 'Game Title' per cercarlo su RAWG!");
      return;
    }

    setFetchingRawg(true);
    try {
      const apiKey = "ca55a690f85e47de9a466956ba72663d";
      const searchRes = await fetch(`https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=1`);
      const searchData = await searchRes.json() as any;

      if (!searchData.results || searchData.results.length === 0) {
        alert("Nessun gioco trovato su RAWG con questo titolo.");
        setFetchingRawg(false);
        return;
      }

      const foundGame = searchData.results[0];
      const gameId = foundGame.id;

      const detailRes = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
      const detailData = await detailRes.json() as any;

      const developerNames = detailData.developers 
        ? detailData.developers.map((d: any) => d.name).join(', ') 
        : '';

      const screenshotsUrls = foundGame.short_screenshots
        ? foundGame.short_screenshots.map((s: any) => s.image).filter((img: string) => !img.includes('placeholder'))
        : [];

      let steamLink = '';
      let gogLink = '';
      let epicLink = '';

      if (detailData.stores && Array.isArray(detailData.stores)) {
        detailData.stores.forEach((s: any) => {
          const slug = s.store?.slug;
          if (slug === 'steam') steamLink = s.url || '';
          if (slug === 'gog') gogLink = s.url || '';
          if (slug === 'epic-games') epicLink = s.url || '';
        });
      }

      setActiveGame(prev => ({
        ...prev,
        title: foundGame.name || prev.title,
        description: detailData.description_raw || detailData.description?.replace(/<[^>]*>/g, '') || prev.description,
        developer: developerNames || prev.developer,
        releaseDate: foundGame.released || prev.releaseDate,
        bannerImage: foundGame.background_image || prev.bannerImage,
        steamScreenshots: screenshotsUrls.length > 0 ? screenshotsUrls : prev.steamScreenshots,
        steamUrl: steamLink,
        gogUrl: gogLink,
        epicUrl: epicLink
      }));

      alert(`Dati, screenshot e link agli Store ufficiali di "${foundGame.name}" scaricati da RAWG!`);

    } catch (err) {
      console.error("Errore RAWG:", err);
      alert("Errore durante il collegamento con l'API di RAWG.");
    } finally {
      setFetchingRawg(false);
    }
  };

  const resetForm = () => {
    setActiveGame(emptyGame);
    setEditingId(null);
    setScreenshotInput('');
  };

  const handleEditGame = (game: Game) => {
    setEditingId(game.id);
    setActiveGame({
      ...game,
      steamScreenshots: [...(game.steamScreenshots || [])],
      tags: [...(game.tags || [])],
      genres: [...(game.genres || [])],
      platforms: [...(game.platforms || [])]
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      title: activeGame.title || 'Untitled Game',
      description: activeGame.description || '',
      developer: activeGame.developer || '',
      pearcrypt_url: activeGame.buzzheavierLink || '', // Inserisce nella colonna originaria di Supabase
      banner_url: activeGame.bannerImage || '',
      video_url: activeGame.videoUrl || '',
      screenshots: activeGame.steamScreenshots || [],
      release_date: activeGame.releaseDate || '',
      is_upcoming: activeGame.isUpcoming || false,
      steam_url: activeGame.steamUrl || '',
      gog_url: activeGame.gogUrl || '',
      epic_url: activeGame.epicUrl || ''
    };

    if (editingId) {
      const { error } = await supabase
        .from('games')
        .update(payload)
        .eq('id', editingId);
        
      if (error) alert("Errore durante la modifica!");
      else alert("Modifica salvata con successo!");
    } else {
      const { data, error } = await supabase
        .from('games')
        .insert([payload])
        .select();

      if (error) {
        console.error(error);
        alert("Errore durante il salvataggio! Controlla la console.");
      } else {
        alert("Gioco aggiunto con successo!");
      }
    }

    fetchGames();
    resetForm();
  };

  const handleDeleteGame = async (id: string) => {
    const conferma = window.confirm("Sei sicuro di voler cancellare questo gioco?");
    if (!conferma) return;

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Errore durante l'eliminazione!");
    } else {
      fetchGames();
      if (editingId === id) resetForm();
    }
  };

  const addScreenshot = () => {
    if (screenshotInput) {
      setActiveGame({
        ...activeGame,
        steamScreenshots: [...(activeGame.steamScreenshots || []), screenshotInput]
      });
      setScreenshotInput('');
    }
  };

  const addUploadedScreenshots = async (files: FileList | null) => {
    if (!files?.length) return;
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const dataUrls = await Promise.all(
      imageFiles.map(file => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      }))
    );
    setActiveGame({
      ...activeGame,
      steamScreenshots: [...(activeGame.steamScreenshots || []), ...dataUrls]
    });
  };

  const removeScreenshot = (index: number) => {
    const filtered = (activeGame.steamScreenshots || []).filter((_, i) => i !== index);
    setActiveGame({ ...activeGame, steamScreenshots: filtered });
  };

  if (!session) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-brand-card p-8 rounded-3xl border border-brand-border w-full max-w-md">
          <div className="flex justify-center mb-6">
            <ShieldAlert className="w-12 h-12 text-brand-red" />
          </div>
          <h2 className="text-2xl font-black text-white text-center mb-8 uppercase">ARES Admin Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" 
              placeholder="Admin Email"
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-red outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Password"
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-red outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="submit"
              className="w-full py-3 bg-brand-red text-white font-bold rounded-xl uppercase tracking-widest"
            >
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-black text-white uppercase italic">Database Management</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red/10 hover:bg-brand-red text-brand-red hover:text-white text-xs font-bold rounded-lg transition-all uppercase tracking-wider"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        <div className="xl:col-span-5">
          <div className="bg-brand-card p-8 rounded-3xl border border-brand-border sticky top-28">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-black text-white uppercase">
                {editingId ? 'Edit Record' : 'Add New Record'}
              </h3>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-xs font-black text-gray-500 hover:text-brand-red uppercase">
                  Cancel
                </button>
              )}
            </div>
            <form onSubmit={handleSaveGame} className="space-y-4">
              
              <div className="flex gap-2">
                <input 
                  placeholder="Game Title"
                  className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-azure"
                  value={activeGame.title || ''}
                  onChange={e => setActiveGame({...activeGame, title: e.target.value})}
                  required
                />
                <button
                  type="button"
                  onClick={handleFetchRawgData}
                  disabled={fetchingRawg}
                  className="px-4 bg-brand-azure hover:brightness-110 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  title="Scarica dati e immagini automaticamente da RAWG"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {fetchingRawg ? 'Fetching...' : 'Autofill'}
                </button>
              </div>

              <textarea 
                placeholder="Description"
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm h-32"
                value={activeGame.description || ''}
                onChange={e => setActiveGame({...activeGame, description: e.target.value})}
                required
              />
              <input
                placeholder="Developer name"
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm"
                value={activeGame.developer || ''}
                onChange={e => setActiveGame({...activeGame, developer: e.target.value})}
              />
              
              <div className="flex items-center gap-3 pl-1 py-1">
                <input 
                  type="checkbox"
                  id="is_upcoming_checkbox"
                  className="w-4 h-4 rounded border-brand-border bg-brand-dark text-brand-azure focus:ring-brand-azure cursor-pointer"
                  checked={activeGame.isUpcoming || false}
                  onChange={e => setActiveGame({...activeGame, isUpcoming: e.target.checked})}
                />
                <label htmlFor="is_upcoming_checkbox" className="text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer select-none">
                  Mark as Upcoming Game (In Arrivo)
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                  Release Date
                </label>
                <input 
                  type="date"
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm"
                  value={activeGame.releaseDate || ''}
                  onChange={e => setActiveGame({...activeGame, releaseDate: e.target.value})}
                />
              </div>

              {/* Sezione Aggiornata per Buzzheavier */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                  Game Link (Buzzheavier)
                </label>
                <div className="flex gap-2">
                  <input 
                    placeholder="Buzzheavier Link (URL)"
                    className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-azure"
                    value={activeGame.buzzheavierLink || ''}
                    onChange={e => setActiveGame({...activeGame, buzzheavierLink: e.target.value})}
                    required={!activeGame.isUpcoming} 
                  />
                  <a
                    href="https://buzzheavier.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-center"
                    title="Apri Buzzheavier in una nuova scheda per l'upload"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </a>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-brand-border/40">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block pl-1">Store Links (Optional)</span>
                <input 
                  placeholder="Steam Store URL"
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm"
                  value={activeGame.steamUrl || ''}
                  onChange={e => setActiveGame({...activeGame, steamUrl: e.target.value})}
                />
                <input 
                  placeholder="GOG Store URL"
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm"
                  value={activeGame.gogUrl || ''}
                  onChange={e => setActiveGame({...activeGame, gogUrl: e.target.value})}
                />
                <input 
                  placeholder="Epic Games Store URL"
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm"
                  value={activeGame.epicUrl || ''}
                  onChange={e => setActiveGame({...activeGame, epicUrl: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <input 
                  placeholder="Banner Image URL"
                  className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm"
                  value={activeGame.bannerImage || ''}
                  onChange={e => setActiveGame({...activeGame, bannerImage: e.target.value})}
                />
                <div className="w-12 h-12 bg-brand-dark border border-brand-border rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-gray-500" />
                </div>
              </div>

              <div className="flex gap-2">
                <input 
                  placeholder="Video URL (.mp4)"
                  className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm"
                  value={activeGame.videoUrl || ''}
                  onChange={e => setActiveGame({...activeGame, videoUrl: e.target.value})}
                />
                <div className="w-12 h-12 bg-brand-dark border border-brand-border rounded-xl flex items-center justify-center">
                  <Video className="w-5 h-5 text-gray-500" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    placeholder="Screenshot URL"
                    className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm"
                    value={screenshotInput}
                    onChange={e => setScreenshotInput(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={addScreenshot}
                    className="px-4 bg-brand-azure text-white rounded-xl font-bold hover:brightness-110"
                  >
                    ADD
                  </button>
                </div>
                <label className="flex items-center justify-center gap-2 border border-dashed border-brand-border rounded-xl px-4 py-3 text-sm font-bold text-gray-400 hover:border-brand-azure hover:text-brand-azure cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload screenshots
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      void addUploadedScreenshots(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {(activeGame.steamScreenshots || []).map((ss, i) => (
                    <div key={i} className="relative group">
                      <img src={ss} className="w-16 h-10 object-cover rounded border border-brand-border" alt="" />
                      <button 
                        type="button"
                        onClick={() => removeScreenshot(i)}
                        className="absolute -top-1 -right-1 bg-brand-red text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-4 bg-brand-azure text-white font-black rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 mt-4 hover:brightness-110">
                {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingId ? 'Save Changes' : 'Commit to Archive'}
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-7">
          <div className="space-y-4">
            {games.map(game => (
              <div key={game.id} className="bg-brand-card p-6 rounded-2xl border border-brand-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={game.bannerImage || 'https://via.placeholder.com/150'} className="w-24 h-14 object-cover rounded-lg" alt="" />
                  <div>
                    <h4 className="text-white font-bold">
                      {game.title}
                      {game.isUpcoming && (
                        <span className="ml-2 text-[9px] bg-brand-azure/20 text-brand-azure px-2 py-0.5 rounded font-black uppercase tracking-wider">Upcoming</span>
                      )}
                    </h4>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] text-gray-500">{game.steamScreenshots?.length || 0} Screenshots</span>
                      {game.videoUrl && <span className="text-[10px] text-brand-azure font-bold">VIDEO ACTIVE</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditGame(game)}
                    className="p-3 text-brand-azure hover:bg-brand-azure/10 rounded-xl transition-colors"
                    aria-label={`Edit ${game.title}`}
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteGame(game.id)}
                    className="p-3 text-brand-red hover:bg-brand-red/10 rounded-xl transition-colors"
                    aria-label={`Delete ${game.title}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;