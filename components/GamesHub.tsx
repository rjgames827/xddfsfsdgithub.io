import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface GameItem {
  file_name: string;
  title: string;
  thumb?: string;
  frame?: string;
}

export function GamesSection() {
  const [games, setGames] = useState<GameItem[]>([]);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/gh/Hydra-Network/hydra-assets@main/gmes.json")
      .then(r => r.json())
      .then((data: GameItem[]) => setGames(data.sort((a, b) => a.title.localeCompare(b.title))))
      .catch(err => console.error("Failed to fetch games:", err));
  }, []);

  const filtered = games.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase())
  );

  const visible = filtered.slice(0, visibleCount);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(v => Math.min(v + 50, filtered.length));
      }
    }, { rootMargin: '400px' });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [filtered.length]);

  // Reset visible count on search change
  useEffect(() => { setVisibleCount(50); }, [search]);

  const openGame = useCallback((game: GameItem) => {
    setActiveGame(game);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeGame = useCallback(() => {
    setActiveGame(null);
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeGame(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [closeGame]);

  const getGameUrl = (game: GameItem) =>
    `https://raw.githack.com/Hydra-Network/hydra-assets/main/gmes/${game.file_name}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-8 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Games</h2>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full p-4 mb-4 bg-surface border border-white/10 text-text-primary rounded-xl outline-none focus:border-accent/50 transition-all placeholder:text-text-muted"
        placeholder={`Search from ${games.length} games`}
      />

      <div className="flex flex-wrap justify-center gap-2.5 p-2.5">
        {visible.map((game, i) => {
          const thumb = game.thumb
            ? `https://raw.githubusercontent.com/Hydra-Network/hydra-assets/main/${game.thumb}`
            : null;
          return (
            <div
              key={game.file_name + i}
              onClick={() => openGame(game)}
              className="group relative w-60 h-36 cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-[var(--bg)] hover:border-white/30 transition-all"
            >
              {thumb ? (
                <img src={thumb} alt={game.title} className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-110" loading="lazy" />
              ) : (
                <div className="w-full h-full rounded-lg bg-surface flex items-center justify-center">
                  <p className="text-text-secondary text-xs">{game.title}</p>
                </div>
              )}
              <div className="absolute inset-0 flex items-end p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-white text-xs font-bold">{game.title}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {visibleCount < filtered.length && (
        <div ref={sentinelRef} className="h-12 w-full" />
      )}

      {/* Game player overlay */}
      {activeGame && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 bg-black/90 border-b border-white/10">
            <button onClick={closeGame} className="text-text-primary font-black uppercase text-xs tracking-widest hover:text-accent transition-colors">
              ← Back
            </button>
            <h1 className="text-text-primary font-bold text-sm">{activeGame.title}</h1>
            <button
              onClick={() => document.getElementById("gameFrame")?.requestFullscreen()}
              className="text-text-primary font-black uppercase text-xs tracking-widest hover:text-accent transition-colors"
            >
              Fullscreen
            </button>
          </div>
          <iframe
            id="gameFrame"
            src={getGameUrl(activeGame)}
            className="w-full flex-1 border-none"
            allow="autoplay; fullscreen"
          />
        </div>
      )}
    </motion.div>
  );
}
