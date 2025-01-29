// src/App.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { database } from './firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { Check, Plus, Trash2, ShoppingCart, LogOut, Share2, Gift } from 'lucide-react';
import { MAGASINS, CATEGORIES, TABS, OCCASIONS } from './config/constants';

// Création d'un composant ItemList pour éviter la répétition
const ItemList = React.memo(({ items, onToggleComplete, onDelete, darkMode }) => {
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div 
          key={item.id}
          id={`item-${item.id}`}
          className={`group flex items-center justify-between p-4 rounded-xl shadow-sm ${
            darkMode 
              ? 'bg-gray-800/50' 
              : 'bg-green-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleComplete(item.id, item.complete)}
              className="p-2 rounded-lg bg-green-500 text-white"
            >
              <Check size={16} />
            </button>
            <div>
              <span className={`line-through ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {item.nom}
              </span>
              <div className="text-sm">
                {item.completePar && `Pris par ${item.completePar}`}
              </div>
            </div>
          </div>
          <button
            onClick={() => onDelete(item.id)}
            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>
  );
});

// Hook personnalisé pour la gestion des notifications
const useNotifications = (items, nom) => {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      items.forEach(item => {
        if (!item.notified && item.ajoutePar !== nom) {
          playNotificationSound();
          new Notification(`Nouvel article ajouté par ${item.ajoutePar}`, {
            body: item.nom
          });
          update(ref(database, `courses/${item.id}`), { notified: true });
        }
      });
    }
  }, [items, nom]);
};

// Hook personnalisé pour la gestion du dark mode
const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  return [darkMode, setDarkMode];
};

// Fonction utilitaire pour jouer un son de notification
const playNotificationSound = () => {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  audio.play().catch(console.error);
};

function App() {
  // États regroupés par fonctionnalité
  const [filters, setFilters] = useState({
    recherche: '',
    sortType: 'date',
    magasin: MAGASINS.CARREFOUR,
    categorie: CATEGORIES.AUTRES,
    urgent: false,
    activeTab: TABS.COURSES,
  });

  const [newItemData, setNewItemData] = useState({
    newItem: '',
    newCadeau: '',
    destinataire: '',
    occasion: OCCASIONS.AUTRE,
    prix: '',
  });

  const [items, setItems] = useState([]);
  const [nom, setNom] = useState(() => localStorage.getItem('nom') || '');
  const [darkMode, setDarkMode] = useDarkMode();
  const [itemEnEdition, setItemEnEdition] = useState(null);
  const [texteEdition, setTexteEdition] = useState('');
  const [magasinsReplies, setMagasinsReplies] = useState(() => {
    return Object.values(MAGASINS).reduce((acc, magasin) => {
      acc[magasin] = false;
      return acc;
    }, {});
  });

  // États pour les cadeaux
  const [cadeaux, setCadeaux] = useState([]);
  const [sortCadeaux, setSortCadeaux] = useState('date');
  const [rechercheCadeaux, setRechercheCadeaux] = useState('');
  const [filtreOccasion, setFiltreOccasion] = useState('TOUTES');
  const [cadeauEnEdition, setCadeauEnEdition] = useState(null);

  // Utilisation des hooks personnalisés
  useNotifications(items, nom);

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const itemsRef = ref(database, 'courses');
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const itemsList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value
        }));
        setItems(itemsList.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setItems([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (nom) {
      localStorage.setItem('nom', nom);
    }
  }, [nom]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      items.forEach(item => {
        if (!item.notified && item.ajoutePar !== nom) {
          playNotificationSound();
          new Notification(`Nouvel article ajouté par ${item.ajoutePar}`, {
            body: item.nom
          });
          update(ref(database, `courses/${item.id}`), { notified: true });
        }
      });
    }
  }, [items, nom]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'n' && e.ctrlKey) {
        // Focus sur le champ d'ajout
        document.querySelector('input[placeholder="Ajouter un article..."]').focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    const itemsUrgents = items.filter(item => !item.complete && item.urgent).length;
    document.title = itemsUrgents > 0 
      ? `(${itemsUrgents} urgent${itemsUrgents > 1 ? 's' : ''}) Liste de courses`
      : 'Liste de courses';
  }, [items]);

  useEffect(() => {
    const cadeauxRef = ref(database, 'cadeaux');
    const unsubscribe = onValue(cadeauxRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const cadeauxList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value
        }));
        setCadeaux(cadeauxList.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setCadeaux([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Ajouter une meta viewport pour le scaling mobile
    const viewport = document.querySelector('meta[name=viewport]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }
  }, []);

  // Optimisation des callbacks avec useCallback
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleNewItemChange = useCallback((key, value) => {
    setNewItemData(prev => ({ ...prev, [key]: value }));
  }, []);

  const ajouterItem = useCallback((e) => {
    e.preventDefault();
    if (newItemData.newItem.trim() && nom) {
      vibrate();
      const itemsRef = ref(database, 'courses');
      push(itemsRef, {
        nom: newItemData.newItem.trim(),
        complete: false,
        ajoutePar: nom,
        magasin: filters.magasin,
        categorie: filters.categorie,
        urgent: filters.urgent,
        timestamp: Date.now()
      });
      setNewItemData(prev => ({ ...prev, newItem: '' }));
      setFilters(prev => ({ ...prev, urgent: false }));
    }
  }, [newItemData.newItem, nom, filters.magasin, filters.categorie, filters.urgent]);

  const toggleComplete = (id, complete) => {
    const itemRef = ref(database, `courses/${id}`);
    update(itemRef, {
      complete: !complete,
      completePar: nom,
      completeTimestamp: Date.now()
    });
  };

  const supprimerItem = (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet article ?')) {
      const element = document.getElementById(`item-${id}`);
      element.classList.add('fade-out');
      setTimeout(() => {
        const itemRef = ref(database, `courses/${id}`);
        remove(itemRef);
      }, 300);
    }
  };

  const toutEffacer = () => {
    if (window.confirm('Voulez-vous vraiment effacer toute la liste ?')) {
      const itemsRef = ref(database, 'courses');
      remove(itemsRef);
    }
  };

  const tempsEcoule = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 60) return `Il y a ${minutes} min`;
    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `Il y a ${heures}h`;
    const jours = Math.floor(heures / 24);
    return `Il y a ${jours}j`;
  };

  // Optimisation des calculs de filtrage
  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => 
      item.nom.toLowerCase().includes(filters.recherche.toLowerCase())
    ).sort((a, b) => {
      switch(filters.sortType) {
        case 'date':
          return b.timestamp - a.timestamp;
        case 'nom':
          return a.nom.localeCompare(b.nom);
        case 'ajoutePar':
          return a.ajoutePar.localeCompare(b.ajoutePar);
        case 'magasin':
          return a.magasin.localeCompare(b.magasin);
        default:
          return 0;
      }
    });
    
    return {
      completed: filtered.filter(item => item.complete),
      uncompleted: filtered.filter(item => !item.complete)
    };
  }, [items, filters.recherche, filters.sortType]);

  const modifierItem = (id) => {
    const itemRef = ref(database, `courses/${id}`);
    update(itemRef, {
      nom: texteEdition.trim(),
      timestamp: Date.now()
    });
    setItemEnEdition(null);
    setTexteEdition('');
  };

  const toggleMagasin = (magasin) => {
    setMagasinsReplies(prev => ({
      ...prev,
      [magasin]: !prev[magasin]
    }));
  };

  const partagerListe = () => {
    const itemsAPartager = filteredItems.uncompleted
      .map(item => `${item.urgent ? '🔴' : '•'} ${item.nom} (${item.magasin})`)
      .join('\n');
      
    const texte = `Liste de courses :\n\n${itemsAPartager}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Liste de courses',
        text: texte
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(texte)
        .then(() => alert('Liste copiée dans le presse-papier !'))
        .catch(console.error);
    }
  };

  const itemsUrgents = useMemo(() => 
    filteredItems.uncompleted.filter(item => item.urgent).length,
    [filteredItems.uncompleted]
  );

  const vibrate = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  };

  const groupBy = (array, key) => {
    return array.reduce((result, item) => ({
      ...result,
      [item[key]]: [...(result[item[key]] || []), item],
    }), {});
  };

  // Optimisation des calculs avec useMemo
  const itemsParMagasin = useMemo(() => {
    return Object.values(MAGASINS).reduce((acc, mag) => {
      acc[mag] = filteredItems.uncompleted.filter(item => item.magasin === mag);
      return acc;
    }, {});
  }, [filteredItems.uncompleted]);

  if (!nom) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-pink-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Liste de Courses
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Choisissez votre profil pour commencer
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => setNom('Greg')}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Greg
            </button>
            <button 
              onClick={() => setNom('Céline')}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-medium hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
            >
              Céline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-xl mx-auto px-2 py-2 sm:px-4 sm:py-4">
        <header className="flex flex-col xs:flex-row items-start xs:items-center gap-4 mb-6">
          <div className="flex items-center justify-between w-full xs:w-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <ShoppingCart className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold">Nos Courses</h1>
            </div>
            
            <div className="flex items-center gap-2 xs:gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <span className={`${nom === 'Greg' ? 'text-blue-500' : 'text-pink-500'} font-medium`}>
                  {nom}
                </span>
                <button onClick={() => setNom('')} className="p-1">
                  <LogOut size={14} />
                </button>
              </div>
              
              <button onClick={partagerListe} className="p-2 rounded-lg hover:bg-gray-800/20">
                <Share2 size={18} />
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-gray-800/20">
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button onClick={toutEffacer} className="p-2 rounded-lg hover:bg-gray-800/20">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilters(prev => ({ ...prev, activeTab: TABS.COURSES }))}
            className={`flex items-center py-2.5 px-4 rounded-xl transition-colors ${
              filters.activeTab === TABS.COURSES
                ? 'bg-blue-500 text-white'
                : darkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart size={18} className="mr-2" />
            Courses
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, activeTab: TABS.CADEAUX }))}
            className={`flex items-center py-2.5 px-4 rounded-xl transition-colors ${
              filters.activeTab === TABS.CADEAUX
                ? 'bg-pink-500 text-white'
                : darkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Gift size={18} className="mr-2" />
            Cadeaux
          </button>
        </div>

        {filters.activeTab === TABS.COURSES ? (
          <div>
            <form onSubmit={ajouterItem} className="mb-4">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newItemData.newItem}
                    onChange={(e) => handleNewItemChange('newItem', e.target.value)}
                    placeholder="Ajouter un article..."
                    className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  />
                  <button 
                    type="submit" 
                    className="flex-shrink-0 p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={filters.magasin}
                    onChange={(e) => handleFilterChange('magasin', e.target.value)}
                    className={`flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    {Object.values(MAGASINS).map(mag => (
                      <option key={mag} value={mag}>{mag}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.categorie}
                    onChange={(e) => handleFilterChange('categorie', e.target.value)}
                    className={`flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    {Object.values(CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  
                  <label className="flex items-center gap-1 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={filters.urgent}
                      onChange={(e) => handleFilterChange('urgent', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm whitespace-nowrap">Urgent</span>
                  </label>
                </div>
              </div>
            </form>

            <div className="mb-4">
              <input
                type="text"
                value={filters.recherche}
                onChange={(e) => handleFilterChange('recherche', e.target.value)}
                placeholder="Rechercher un article..."
                className={`w-full px-4 py-3 ${
                  darkMode 
                    ? 'bg-gray-800 text-white placeholder-gray-400' 
                    : 'bg-white text-gray-800 placeholder-gray-500'
                } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            <div className="flex justify-end mb-2">
              <select 
                onChange={(e) => {
                  handleFilterChange('sortType', e.target.value);
                }}
                value={filters.sortType}
                className={`px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 text-white border-gray-700' 
                    : 'bg-white text-gray-800 border-gray-200'
                }`}
              >
                <option value="date">Tri par date</option>
                <option value="nom">Tri par nom</option>
                <option value="ajoutePar">Tri par personne</option>
                <option value="magasin">Tri par magasin</option>
              </select>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {filteredItems.uncompleted.length > 0 && (
                <section>
                  <h2 className={`text-lg font-semibold mb-3 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    À acheter ({filteredItems.uncompleted.length})
                    {itemsUrgents > 0 && (
                      <span className="ml-2 text-sm bg-red-500 text-white px-2 py-1 rounded-full">
                        {itemsUrgents} urgent{itemsUrgents > 1 ? 's' : ''}
                      </span>
                    )}
                  </h2>
                  {Object.values(MAGASINS).map(magasin => {
                    const itemsDuMagasin = filteredItems.uncompleted.filter(item => item.magasin === magasin);
                    if (itemsDuMagasin.length === 0) return null;
                    
                    return (
                      <div key={magasin} className="mb-6">
                        <button
                          onClick={() => toggleMagasin(magasin)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                            darkMode 
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                              : 'bg-blue-50 text-gray-600 hover:bg-blue-100'
                          }`}
                        >
                          <h3 className={`text-md font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {magasin} ({itemsDuMagasin.length})
                          </h3>
                          <span className="transform transition-transform duration-200" 
                            style={{ 
                              transform: magasinsReplies[magasin] ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                          >
                            ▼
                          </span>
                        </button>
                        <div className={`space-y-2 mt-2 transition-all duration-200 ${
                          magasinsReplies[magasin] ? 'hidden' : ''
                        }`}>
                          {itemsDuMagasin.map(item => (
                            <div 
                              key={item.id}
                              id={`item-${item.id}`}
                              className={`group flex items-center justify-between p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow ${
                                item.urgent
                                  ? darkMode 
                                    ? 'bg-red-900/20 hover:bg-red-900/30 animate-pulse' 
                                    : 'bg-red-50 hover:bg-red-100/80'
                                  : darkMode 
                                    ? 'bg-gray-800 hover:bg-gray-750' 
                                    : 'bg-blue-50 hover:bg-blue-100'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <button
                                  onClick={() => toggleComplete(item.id, item.complete)}
                                  className="p-2 rounded-lg bg-gray-100 hover:bg-green-500 hover:text-white transition-colors"
                                >
                                  <Check size={16} />
                                </button>
                                <div className="flex-1">
                                  {itemEnEdition === item.id ? (
                                    <form 
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        modifierItem(item.id);
                                      }}
                                      className="flex flex-col sm:flex-row gap-2"
                                    >
                                      <input
                                        type="text"
                                        value={texteEdition}
                                        onChange={(e) => setTexteEdition(e.target.value)}
                                        className={`flex-1 px-2 py-1 sm:px-3 sm:py-2 rounded-lg ${
                                          darkMode 
                                            ? 'bg-gray-700 text-white' 
                                            : 'bg-white text-gray-800'
                                        }`}
                                        autoFocus
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          type="submit"
                                          className="flex-1 sm:flex-none px-3 py-1 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                        >
                                          OK
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setItemEnEdition(null);
                                            setTexteEdition('');
                                          }}
                                          className="flex-1 sm:flex-none px-3 py-1 sm:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                        >
                                          Annuler
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <>
                                      <span 
                                        className={`font-medium ${
                                          item.urgent 
                                            ? 'text-red-500 font-bold' 
                                            : darkMode 
                                              ? 'text-gray-100' 
                                              : 'text-gray-800'
                                        }`}
                                        onClick={() => {
                                          setItemEnEdition(item.id);
                                          setTexteEdition(item.nom);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                      >
                                        {item.urgent && '🔴 '}{item.nom}
                                        {item.urgent && (
                                          <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                                            URGENT
                                          </span>
                                        )}
                                      </span>
                                      <div className="text-sm">
                                        Ajouté par <span className={item.ajoutePar === 'Greg' ? 'text-blue-500' : 'text-pink-500'}>
                                          {item.ajoutePar}
                                        </span>
                                        {' • '}{tempsEcoule(item.timestamp)}
                                        {' • '}<span className="text-gray-500">{item.categorie}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => supprimerItem(item.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}

              {filteredItems.completed.length > 0 && (
                <section>
                  <h2 className={`text-lg font-semibold mb-3 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    Déjà pris ({filteredItems.completed.length})
                  </h2>
                  <ItemList 
                    items={filteredItems.completed}
                    onToggleComplete={toggleComplete}
                    onDelete={supprimerItem}
                    darkMode={darkMode}
                  />
                </section>
              )}

              {filteredItems.uncompleted.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    Votre liste est vide
                  </div>
                  <div className="text-sm text-gray-500">
                    Ajoutez des articles pour commencer
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newItemData.newCadeau && newItemData.destinataire) {
                const cadeauxRef = ref(database, 'cadeaux');
                push(cadeauxRef, {
                  nom: newItemData.newCadeau.trim(),
                  destinataire: newItemData.destinataire.trim(),
                  occasion: newItemData.occasion,
                  prix: newItemData.prix || 'Non défini',
                  ajoutePar: nom,
                  timestamp: Date.now(),
                  achete: false
                });
                setNewItemData(prev => ({
                  ...prev,
                  newCadeau: '',
                  destinataire: '',
                  occasion: OCCASIONS.AUTRE,
                  prix: '',
                }));
              }
            }} className="mb-6">
              <div className={`space-y-2 p-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <input
                  type="text"
                  value={newItemData.newCadeau}
                  onChange={(e) => handleNewItemChange('newCadeau', e.target.value)}
                  placeholder="Idée cadeau..."
                  className={`w-full px-3 py-2 rounded-lg bg-transparent focus:outline-none ${
                    darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
                  }`}
                />
                <div className="flex flex-col xs:flex-row gap-2">
                  <input
                    type="text"
                    value={newItemData.destinataire}
                    onChange={(e) => handleNewItemChange('destinataire', e.target.value)}
                    placeholder="Pour qui ?"
                    className={`flex-1 px-3 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  />
                  <input
                    type="text"
                    value={newItemData.prix}
                    onChange={(e) => handleNewItemChange('prix', e.target.value)}
                    placeholder="Prix estimé"
                    className={`w-full xs:w-1/3 px-3 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <select
                    value={newItemData.occasion}
                    onChange={(e) => handleNewItemChange('occasion', e.target.value)}
                    className={`px-3 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    {Object.values(OCCASIONS).map(occ => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </form>

            <div className="flex justify-end mb-4">
              <select 
                onChange={(e) => setSortCadeaux(e.target.value)}
                value={sortCadeaux}
                className={`px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 text-white border-gray-700' 
                    : 'bg-white text-gray-800 border-gray-200'
                }`}
              >
                <option value="date">Tri par date</option>
                <option value="prix">Tri par prix</option>
                <option value="occasion">Tri par occasion</option>
              </select>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={rechercheCadeaux}
                onChange={(e) => setRechercheCadeaux(e.target.value)}
                placeholder="Rechercher un cadeau..."
                className={`w-full px-4 py-3 ${
                  darkMode 
                    ? 'bg-gray-800 text-white placeholder-gray-400' 
                    : 'bg-white text-gray-800 placeholder-gray-500'
                } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500`}
              />
            </div>

            <div className="flex justify-end mb-4">
              <select
                value={filtreOccasion}
                onChange={(e) => setFiltreOccasion(e.target.value)}
                className={`px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <option value="TOUTES">Toutes les occasions</option>
                {Object.values(OCCASIONS).map(occ => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {Object.entries(groupBy(cadeaux.filter(cadeau => 
                cadeau.nom.toLowerCase().includes(rechercheCadeaux.toLowerCase()) &&
                (filtreOccasion === 'TOUTES' || cadeau.occasion === filtreOccasion)
              ).sort((a, b) => {
                switch(sortCadeaux) {
                  case 'prix':
                    return parseFloat(b.prix) - parseFloat(a.prix);
                  case 'occasion':
                    return a.occasion.localeCompare(b.occasion);
                  default:
                    return b.timestamp - a.timestamp;
                }
              }), 'destinataire')).map(([dest, items]) => (
                <div key={dest} className={`p-4 rounded-xl ${
                  darkMode ? 'bg-gray-800/50' : 'bg-pink-50'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-pink-300' : 'text-pink-600'
                  }`}>
                    🎁 {dest}
                  </h3>
                  <div className="space-y-3">
                    {items.map(cadeau => (
                      <div
                        key={cadeau.id}
                        className={`group flex items-center justify-between p-4 rounded-lg transition-all ${
                          cadeau.achete
                            ? darkMode 
                              ? 'bg-gray-700/50' 
                              : 'bg-gray-100'
                            : darkMode 
                              ? 'bg-gray-800 hover:bg-gray-750' 
                              : 'bg-white hover:bg-pink-100/80'
                        } ${
                          cadeau.achete ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg ${cadeau.achete ? 'line-through' : ''}`}>
                              {cadeau.nom}
                            </span>
                            <span className={`text-sm px-2 py-0.5 rounded-full ${
                              darkMode 
                                ? 'bg-gray-700 text-pink-300' 
                                : 'bg-pink-100 text-pink-600'
                            }`}>
                              {cadeau.occasion}
                            </span>
                          </div>
                          <div className={`text-sm mt-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Ajouté par <span className={
                              cadeau.ajoutePar === 'Greg' ? 'text-blue-500' : 'text-pink-500'
                            }>{cadeau.ajoutePar}</span>
                            {' • '}{tempsEcoule(cadeau.timestamp)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {cadeau.prix && (
                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                              darkMode 
                                ? 'bg-gray-700 text-green-400' 
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {cadeau.prix}€
                            </span>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const cadeauRef = ref(database, `cadeaux/${cadeau.id}`);
                                update(cadeauRef, { 
                                  achete: !cadeau.achete,
                                  achetePar: !cadeau.achete ? nom : null,
                                  dateAchat: !cadeau.achete ? Date.now() : null
                                });
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                cadeau.achete 
                                  ? 'bg-green-500 text-white hover:bg-green-600' 
                                  : darkMode 
                                    ? 'bg-pink-500 text-white hover:bg-pink-600' 
                                    : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                              }`}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Supprimer cette idée ?')) {
                                  const cadeauRef = ref(database, `cadeaux/${cadeau.id}`);
                                  remove(cadeauRef);
                                }
                              }}
                              className="p-2 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;