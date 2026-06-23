import React, { useState, useEffect } from 'react';
import { GameCard } from '../components/GameCard';
import { supabase } from '../supabase'; 
import { Game } from '../types/game';
import { Filter, ChevronDown, Loader2, Sparkles, FolderArchive, ChevronRight } from 'lucide-react';

interface HomeProps {
  searchQuery: string;
}

const Home: React.FC<HomeProps> = ({ searchQuery }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [visibleLimit, setVisibleLimit] = useState(24);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error("Errore nel recupero dei giochi:", error);
      } else if (data) {
        // Recupera la lingua attiva nel browser dell'utente (di default 'en')
        const userLang = localStorage.getItem('ares_lang') || 'en';

        const mappedGames: Game[] = data.map(dbGame => {
          // Seleziona dinamicamente il titolo tradotto se presente in tabella, altrimenti usa l'originale
          const title = 
            (userLang === 'it' && (dbGame as any).title_it) ? (dbGame as any).title_it : 
            (userLang === 'es' && (dbGame as any).title_es) ? (dbGame as any).title_es : 
            dbGame.title;

          // Seleziona dinamicamente la descrizione tradotta se presente in tabella, altrimenti usa l'originale
          const description = 
            (userLang === 'it' && (dbGame as any).description_it) ? (dbGame as any).description_it : 
            (userLang === 'es' && (dbGame as any).description_es) ? (dbGame as any).description_es : 
            dbGame.description;

          return {
            id: dbGame.id.toString(),
            title: title || '',
            description: description || '',
            developer: dbGame.developer || '',
            pearcryptLink: dbGame.pearcrypt_url || '',
            bannerImage: dbGame.banner_url || '',
            videoUrl: dbGame.video_url || '',
            steamScreenshots: dbGame.screenshots || [],
            isUpcoming: dbGame.is_upcoming || false, 
            tags: ['New'],
            genres: dbGame.genres || [], 
            platforms: ['windows'],
            releaseDate: dbGame.release_date || dbGame.created_at || new Date().toLocaleDateString(),
          };
        });
        
        setGames(mappedGames);
      }
      setLoading(false);
    };
    fetchGames();
  }, []);

  const archivedGames = games.filter(game => !game.isUpcoming && game.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const upcomingGames = games.filter(game => game.isUpcoming && game.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredArchivedGames = archivedGames.filter(game => {
    if (activeFilter === 'All') return true;
    return game.genres?.includes(activeFilter);
  });

  const displayedArchivedGames = filteredArchivedGames.slice(0, visibleLimit);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-brand-azure animate-spin mb-4" />
        <p className="text-gray-400 animate-pulse">Accessing archives...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tight mb-2 flex items-center gap-2">
            <FolderArchive className="w-8 h-8 text-brand-azure" />
            Preservation Database
          </h1>
          <p className="text-gray-400">Archiving digital history, one byte at a time.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-sm hover:border-brand-azure transition-colors text-white">
              <Filter className="w-4 h-4" />
              <span>Genre: {activeFilter}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-brand-card border border-brand-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              {['All', 'Action', 'Adventure', 'RPG', 'Indie', 'Strategy'].map(genre => (
                <button
                  key={genre}
                  onClick={() => setActiveFilter(genre)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-brand-azure hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg text-gray-300"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {displayedArchivedGames.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedArchivedGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {filteredArchivedGames.length > visibleLimit && (
            <div className="flex justify-center mt-12">
              <button 
                onClick={() => setVisibleLimit(prev => prev + 12)} 
                className="flex items-center gap-2 px-6 py-3 bg-brand-card hover:bg-brand-azure/20 border border-brand-border hover:border-brand-azure text-white text-xs font-black rounded-xl transition-all uppercase tracking-widest"
              >
                Load More Games
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 bg-brand-card rounded-2xl border border-dashed border-brand-border">
          <p className="text-gray-400 text-sm">No archived records found matching your criteria.</p>
        </div>
      )}

      {upcomingGames.length > 0 && (
        <div className="mt-20 pt-12 border-t border-brand-border">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight mb-2 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-brand-azure animate-pulse" />
              Upcoming Games
            </h2>
            <p className="text-gray-400">Most anticipated contemporary releases and digital-only files.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {upcomingGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;