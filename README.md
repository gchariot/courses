# Liste de Courses

Une application web moderne pour gérer vos listes de courses en temps réel, construite avec React et Firebase.

## 🌟 Fonctionnalités

### Gestion des utilisateurs

- Système de profils simplifiés (Greg/Céline)
- Identification rapide sans mot de passe
- Code couleur par utilisateur (bleu pour Greg, rose pour Céline)

### Gestion des articles

- Ajout d'articles avec magasin et catégorie
- Mode urgent pour les articles prioritaires
- Modification des articles existants
- Suppression d'articles
- Marquage des articles comme "achetés"
- Historique des articles achetés

### Organisation

- Tri par magasin avec système de repli/dépli
- Filtrage par nom d'article
- Tri par date, nom, personne ou magasin
- Catégorisation des produits (Fruits et Légumes, Viande, etc.)

### Interface

- Mode sombre/clair
- Design responsive
- Animations fluides
- Interface intuitive et moderne

### Partage

- Fonction de partage de la liste
- Compatible avec l'API Web Share
- Copie dans le presse-papier en fallback

### Temps réel

- Synchronisation en temps réel via Firebase
- Notifications pour les nouveaux articles
- Horodatage des actions

## 🛠 Technologies

- React 18
- Firebase Realtime Database
- Tailwind CSS
- Vite
- Lucide Icons

## 📱 Installation

1. Cloner le repository :

## 🚀 Déploiement

L'application est hébergée sur Vercel. Il y a deux façons de déployer les mises à jour :

### 1. Déploiement automatique (recommandé)

Connectez votre repository GitHub à Vercel. À chaque push sur la branche main, Vercel détectera automatiquement les changements et redéploiera votre site.

### 2. Déploiement manuel

Si vous ne souhaitez pas passer par git, vous pouvez déployer directement depuis votre terminal : vercel --prod
