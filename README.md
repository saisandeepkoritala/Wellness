# 🌟 Wellness Tracker - Multi-User Edition

A comprehensive wellness tracking web application built with React, TypeScript, and Firebase. Track your daily meals, workouts, skincare routines, and tasks with automatic calorie calculation and cloud-based data persistence.

## ✨ Features

### 🔐 **Multi-User Authentication**
- **Email/Password Login** - Traditional authentication
- **Google Sign-In** - One-click authentication
- **User Profiles** - Individual data isolation
- **Secure Logout** - Proper session management
- **Password Protection** - Secure account creation

### 🍽️ **Enhanced Meal Tracking**
- **ChatGPT-Powered Meal Parsing** - Advanced AI parsing with confidence scoring and validation
- **AI-Powered Nutrition Calculation** - Automatically calculate nutrition facts from meal descriptions
- **Natural Language Input** - Type meal descriptions in plain English
- **Nutrition Suggestions** - Get AI-powered meal optimization tips
- **Automatic Calorie Calculation** - Based on macronutrients (fat=9 cal/g, carbs=4 cal/g, protein=4 cal/g)
- **Real-time Calculation** - See calories update as you type
- **Detailed Nutrition** - Track fats, carbs, protein for each meal
- **Meal Types** - Breakfast, lunch, dinner, snacks
- **Nutrition Summary** - Daily totals and breakdowns

### 💪 **Advanced Workout Tracking**
- **Completion Status** - Mark workouts as completed or skipped
- **Detailed Metrics** - Track workout type, weights, reps, duration
- **Intensity Levels** - Low, medium, or high intensity
- **Progress Analytics** - Completion rates and workout summaries

### ✨ **Customizable Skincare Routine**
- **Personalized Steps** - Add, edit, and delete your own skincare steps
- **Morning & Evening Routines** - Separate routines for different times
- **Categories** - Cleanser, toner, serum, moisturizer, sunscreen, mask, exfoliator, custom
- **Progress Tracking** - Visual progress bars and completion rates
- **Routine Management** - Full customization of your skincare regimen

### 📝 **Task Management**
- **Priority Levels** - High, medium, low priority tasks
- **Completion Tracking** - Mark tasks as done with visual indicators
- **Progress Analytics** - Task completion rates and summaries

### ☁️ **Cloud Data Storage**
- **Firebase Firestore** - Real-time cloud database
- **User Data Isolation** - Each user's data is completely separate
- **Cross-Device Sync** - Access your data from any device
- **Automatic Backup** - No data loss, ever
- **Real-time Updates** - Changes sync instantly across devices

## 🚀 **Technology Stack**

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore (NoSQL)
- **Hosting**: Firebase Hosting (or any static host)
- **Icons**: Lucide React for beautiful, scalable icons
- **Date Handling**: date-fns for robust date operations

## 📦 **Installation & Setup**

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### 1. **Clone and Install**
```bash
git clone <your-repo-url>
cd wellness-tracker
npm install
```

### 2. **Firebase Setup**

#### **Create Firebase Project:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "wellness-tracker")
4. Enable Google Analytics (optional)
5. Click "Create project"

#### **Enable Authentication:**
1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Enable "Email/Password"
3. Enable "Google" (optional)
4. Add your domain to authorized domains

#### **Create Firestore Database:**
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users

#### **Get Firebase Config:**
1. Go to "Project settings" (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → "Web"
4. Register app and copy the config

### 3. **Configure Firebase**
Replace the placeholder config in `src/firebase/config.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. **Configure AI Meal Calculation (Optional)**
For AI-powered nutrition calculation, get free API keys from [Edamam](https://developer.edamam.com/edamam-nutrition-api):

1. Sign up at [Edamam Developer Portal](https://developer.edamam.com/)
2. Create a new application
3. Get your App ID and API Key

### 5. **Configure ChatGPT Integration (Optional)**
For advanced AI-powered meal parsing and nutrition suggestions using ChatGPT, get an API key from [OpenAI](https://platform.openai.com/):

1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Create an API key (GPT-4 access recommended)
3. Add to your `.env` file:

```bash
REACT_APP_EDAMAM_APP_ID=your_app_id_here
REACT_APP_EDAMAM_API_KEY=your_api_key_here
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: The app works without AI calculation - it will use a built-in food database as fallback.

### 6. **Set Up Security Rules**
In Firebase Console → Firestore Database → Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow access to subcollections
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 7. **Run the Application**
```bash
npm start
```

## 🎯 **Usage**

### **For End Users:**
1. **Sign Up/Login** - Create account or sign in with Google
2. **Navigate Dates** - Use arrow buttons or "Today" button
3. **Add Meals** - Use AI calculation or manually enter nutrition facts
4. **Log Workouts** - Track completion, type, weights, reps
5. **Customize Skincare** - Add personal routine steps
6. **Manage Tasks** - Set priorities and track completion
7. **View Progress** - See daily summaries and statistics

### **For Developers:**
- **User Data Structure**: Each user has isolated data in Firestore
- **Real-time Sync**: Changes update instantly across devices
- **Offline Support**: Firebase handles offline/online transitions
- **Scalable**: Firebase scales automatically with user growth

## 🏗️ **Architecture**

### **Data Structure:**
```
users/
  {userId}/
    dailyData/
      {date}/
        meals: [...]
        workouts: [...]
        skincare: [...]
        tasks: [...]
    settings/
      skincareRoutine/
        morning: [...]
        evening: [...]
```

### **Authentication Flow:**
1. User signs up/logs in
2. Firebase creates user account
3. User data is isolated by `userId`
4. All operations are scoped to user's data
5. Real-time updates sync across devices

## 🌐 **Deployment**

### **Firebase Hosting (Recommended):**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### **Alternative Hosting:**
- **Vercel**: Connect GitHub repo, automatic deployments
- **Netlify**: Drag and drop `build` folder
- **GitHub Pages**: Use `npm run deploy`

## 🔧 **Customization**

### **Adding New Features:**
- **Social Features**: Share progress with friends
- **Data Export**: Download data as CSV/PDF
- **Notifications**: Remind users of daily tasks
- **Analytics**: Track long-term wellness trends
- **API Integration**: Connect with fitness devices

### **Styling:**
- Modify `tailwind.config.js` for theme changes
- Update `src/index.css` for custom styles
- Add new components in `src/components/`

## 📊 **Multi-User Benefits**

### **For Users:**
- **Privacy**: Complete data isolation
- **Accessibility**: Use from any device
- **Reliability**: No data loss with cloud backup
- **Collaboration**: Share progress with family/friends (future feature)

### **For Developers:**
- **Scalability**: Firebase handles millions of users
- **Security**: Built-in authentication and authorization
- **Analytics**: Track app usage and user behavior
- **Monetization**: Easy to add premium features

## 🚀 **Production Checklist**

- [ ] Set up Firebase project
- [ ] Configure authentication providers
- [ ] Set up Firestore security rules
- [ ] Deploy to Firebase Hosting
- [ ] Set up custom domain (optional)
- [ ] Configure analytics (optional)
- [ ] Set up monitoring and alerts
- [ ] Test with multiple users
- [ ] Implement error tracking
- [ ] Set up backup strategies

## 💰 **Cost Considerations**

### **Firebase Free Tier (Spark Plan):**
- **Authentication**: 10,000 users/month
- **Firestore**: 1GB storage, 50,000 reads/day, 20,000 writes/day
- **Hosting**: 10GB storage, 360MB/day transfer
- **Perfect for**: Small to medium apps, MVPs, personal projects

### **Firebase Paid Plans:**
- **Blaze Plan**: Pay-as-you-go, scales automatically
- **Costs**: ~$0.18/GB storage, $0.06/100K reads, $0.18/100K writes
- **Suitable for**: Growing apps, production deployments

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is open source and available under the [MIT License](LICENSE).

## 🆘 **Support**

For questions or issues:
- Check the documentation
- Open an issue on GitHub
- Review Firebase documentation
- Check the code comments

---

**Built with ❤️ using React, TypeScript, Firebase, and Tailwind CSS**

**Ready for production deployment and multi-user scaling! 🚀**
