// src/App.jsx
import { useState, useEffect, useMemo } from 'react';
import { database } from './firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { Check, Plus, Trash2, ShoppingCart, LogOut } from 'lucide-react';
import { CATEGORIES, MAGASINS } from './config/constants';

function App() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [nom, setNom] = useState(() => localStorage.getItem('nom') || '');
  const [recherche, setRecherche] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [sortType, setSortType] = useState('date');
  const [categorie, setCategorie] = useState(CATEGORIES.AUTRES);
  const [magasin, setMagasin] = useState(MAGASINS.CARREFOUR);

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
          new Notification(`Nouvel article ajouté par ${item.ajoutePar}`, {
            body: item.nom
          });
          update(ref(database, `courses/${item.id}`), { notified: true });
        }
      });
    }
  }, [items, nom]);

  const ajouterItem = (e) => {
    e.preventDefault();
    if (newItem.trim() && nom) {
      const itemsRef = ref(database, 'courses');
      push(itemsRef, {
        nom: newItem.trim(),
        complete: false,
        ajoutePar: nom,
        categorie,
        magasin,
        timestamp: Date.now()
      });
      setNewItem('');
    }
  };

  const toggleComplete = (id, complete) => {
    const itemRef = ref(database, `courses/${id}`);
    update(itemRef, {
      complete: !complete,
      completePar: nom,
      completeTimestamp: Date.now()
    });
  };

  const supprimerItem = (id) => {
    const itemRef = ref(database, `courses/${id}`);
    remove(itemRef);
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

  const itemsFiltres = useMemo(() => 
    items.filter(item => 
      item.nom.toLowerCase().includes(recherche.toLowerCase())
    ).sort((a, b) => {
      switch(sortType) {
        case 'date':
          return b.timestamp - a.timestamp;
        case 'nom':
          return a.nom.localeCompare(b.nom);
        case 'ajoutePar':
          return a.ajoutePar.localeCompare(b.ajoutePar);
        case 'categorie':
          return a.categorie.localeCompare(b.categorie);
        case 'magasin':
          return a.magasin.localeCompare(b.magasin);
        default:
          return 0;
      }
    }), [items, recherche, sortType]
  );

  const itemsNonCompletes = useMemo(() => 
    itemsFiltres.filter(item => !item.complete),
    [itemsFiltres]
  );

  const itemsCompletes = useMemo(() => 
    itemsFiltres.filter(item => item.complete),
    [itemsFiltres]
  );

  const stats = {
    totalItems: items.length,
    completedByGreg: items.filter(i => i.completePar === 'Greg').length,
    completedByCeline: items.filter(i => i.completePar === 'Céline').length,
    addedByGreg: items.filter(i => i.ajoutePar === 'Greg').length,
    addedByCeline: items.filter(i => i.ajoutePar === 'Céline').length,
  };

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
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-xl mx-auto p-4">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <ShoppingCart className="text-white" size={24} />
            </div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Nos Courses
            </h1>
          </div>
          
          <div className="flex items-center gap-6 ml-8">
            <div className={`flex items-center gap-2 px-4 py-2 ${
              darkMode 
                ? 'bg-gray-800 text-gray-300' 
                : 'bg-white text-gray-600'
            } rounded-lg shadow-sm`}>
              {nom}
              <button 
                onClick={() => setNom('')}
                className={`hover:text-gray-400 transition-colors ${
                  darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <LogOut size={18} />
              </button>
            </div>
            
            <button 
              onClick={toutEffacer}
              className={`px-4 py-2 rounded-lg transition-colors shadow-sm ${
                darkMode
                  ? 'bg-gray-800 text-red-400 hover:bg-red-500/20'
                  : 'bg-white text-red-500 hover:bg-red-50'
              }`}
            >
              Tout effacer
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors shadow-sm ${
                darkMode 
                  ? 'bg-gray-800 text-yellow-400 hover:bg-yellow-500/20' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <form onSubmit={ajouterItem} className="mb-8">
          <div className={`space-y-2 p-4 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-xl shadow-sm`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Ajouter un article..."
                className={`flex-1 px-4 py-3 rounded-lg bg-transparent focus:outline-none ${
                  darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
                }`}
              />
              <button
                type="submit"
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-gray-50 text-gray-800 border-gray-200'
                } border`}
              >
                {Object.values(CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={magasin}
                onChange={(e) => setMagasin(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-gray-50 text-gray-800 border-gray-200'
                } border`}
              >
                {Object.values(MAGASINS).map(mag => (
                  <option key={mag} value={mag}>{mag}</option>
                ))}
              </select>
            </div>
          </div>
        </form>

        <div className="mb-4">
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
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
              setSortType(e.target.value);
            }}
            value={sortType}
            className={`px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 text-white border-gray-700' 
                : 'bg-white text-gray-800 border-gray-200'
            }`}
          >
            <option value="date">Tri par date</option>
            <option value="nom">Tri par nom</option>
            <option value="ajoutePar">Tri par personne</option>
            <option value="categorie">Tri par catégorie</option>
            <option value="magasin">Tri par magasin</option>
          </select>
        </div>

        <div className="space-y-6">
          {itemsNonCompletes.length > 0 && (
            <section>
              <h2 className={`text-lg font-semibold mb-3 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                À acheter ({itemsNonCompletes.length})
              </h2>
              {Object.values(MAGASINS).map(magasin => {
                const itemsDuMagasin = itemsNonCompletes.filter(item => item.magasin === magasin);
                if (itemsDuMagasin.length === 0) return null;
                
                return (
                  <div key={magasin} className="mb-6">
                    <h3 className={`text-md font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {magasin} ({itemsDuMagasin.length})
                    </h3>
                    <div className="space-y-2">
                      {itemsDuMagasin.map(item => (
                        <div 
                          key={item.id}
                          className={`group flex items-center justify-between p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow ${
                            darkMode 
                              ? 'bg-gray-800 hover:bg-gray-750' 
                              : 'bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleComplete(item.id, item.complete)}
                              className="p-2 rounded-lg bg-gray-100 hover:bg-green-500 hover:text-white transition-colors"
                            >
                              <Check size={16} />
                            </button>
                            <div>
                              <span className={`font-medium ${
                                darkMode ? 'text-gray-100' : 'text-gray-800'
                              }`}>
                                {item.nom}
                              </span>
                              <div className="text-sm">
                                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {item.categorie}
                                </span>
                                <br />
                                Ajouté par <span className={item.ajoutePar === 'Greg' ? 'text-blue-500' : 'text-pink-500'}>
                                  {item.ajoutePar}
                                </span>
                                {' • '}{tempsEcoule(item.timestamp)}
                              </div>
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

          {itemsCompletes.length > 0 && (
            <section>
              <h2 className={`text-lg font-semibold mb-3 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Déjà pris ({itemsCompletes.length})
              </h2>
              <div className="space-y-2">
                {itemsCompletes.map(item => (
                  <div 
                    key={item.id}
                    className={`group flex items-center justify-between p-4 rounded-xl shadow-sm ${
                      darkMode 
                        ? 'bg-gray-800/50' 
                        : 'bg-green-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleComplete(item.id, item.complete)}
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
                          Pris par <span className={item.completePar === 'Greg' ? 'text-blue-500' : 'text-pink-500'}>
                            {item.completePar}
                          </span>
                        </div>
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
            </section>
          )}

          {items.length === 0 && (
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

        <div className={`mt-8 p-4 rounded-xl shadow-sm ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Statistiques
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`text-center p-3 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-blue-500">
                {itemsNonCompletes.length}
              </div>
              <div className={`text-sm ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Articles à acheter
              </div>
            </div>
            <div className={`text-center p-3 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-green-500">
                {itemsCompletes.length}
              </div>
              <div className={`text-sm ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Articles achetés
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;