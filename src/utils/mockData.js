export const mockUser = {
  id: 1,
  name: 'Rahul Verma',
  email: 'rahul@example.com',
  phone: '9876543210',
  walletBalance: 1250,
  userType: 'user',
}

export const mockCreators = [
  {
    id: 1,
    name: 'Riya Sharma',
    specialty: 'Fitness Trainer',
    bio: 'Certified fitness coach | 5+ years exp. Helping 10k+ people transform 💪',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    rating: 4.8,
    reviews: 120,
    isOnline: true,
    callRate: 50,
    chatRate: 10,
    content: [
      { id: 1, type: 'photo', title: 'Free Preview', price: 0, isFree: true, url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
      { id: 2, type: 'photo_pack', title: 'Fitness Pack 1', price: 49, photos: [
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
      ]},
      { id: 3, type: 'photo_pack', title: 'Workout Pack 2', price: 99, photos: [
        'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400',
        'https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=400',
      ]},
      { id: 4, type: 'video', title: 'Full Body Workout', price: 100, url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', duration: '15 min' },
      { id: 5, type: 'video', title: 'Diet Plan Video', price: 149, url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400', duration: '20 min' },
    ]
  },
  {
    id: 2,
    name: 'Arjun Mehta',
    specialty: 'Motivational Speaker',
    bio: 'Life coach | TEDx Speaker | Helping you unlock your potential 🚀',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rating: 4.9,
    reviews: 200,
    isOnline: false,
    callRate: 80,
    chatRate: 15,
    content: [
      { id: 1, type: 'photo', title: 'Free Preview', price: 0, isFree: true, url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
      { id: 2, type: 'photo_pack', title: 'Motivation Pack', price: 79, photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      ]},
      { id: 3, type: 'video', title: 'Morning Motivation', price: 120, url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', duration: '10 min' },
    ]
  },
  {
    id: 3,
    name: 'Neha Singh',
    specialty: 'Yoga Instructor',
    bio: 'Certified Yoga expert | 200hr YTT | Mindfulness & wellness coach 🧘',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    rating: 4.7,
    reviews: 95,
    isOnline: true,
    callRate: 40,
    chatRate: 8,
    content: [
      { id: 1, type: 'photo', title: 'Free Preview', price: 0, isFree: true, url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400' },
      { id: 2, type: 'photo_pack', title: 'Yoga Poses Pack', price: 59, photos: [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
        'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400',
      ]},
      { id: 3, type: 'video', title: 'Morning Yoga', price: 89, url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', duration: '25 min' },
    ]
  },
]

export const mockTransactions = [
  { id: 1, type: 'call', creator: 'Riya Sharma', amount: -50, date: 'Today, 10:30 AM' },
  { id: 2, type: 'content', creator: 'Neha Singh', amount: -100, date: 'Yesterday' },
  { id: 3, type: 'add_money', creator: null, amount: 500, date: '22 Apr 2025' },
  { id: 4, type: 'chat', creator: 'Arjun Mehta', amount: -30, date: '21 Apr 2025' },
  { id: 5, type: 'content', creator: 'Riya Sharma', amount: -49, date: '20 Apr 2025' },
  { id: 6, type: 'add_money', creator: null, amount: 1000, date: '18 Apr 2025' },
  { id: 7, type: 'call', creator: 'Neha Singh', amount: -80, date: '17 Apr 2025' },
]

export const mockChats = [
  {
    id: 1,
    creatorId: 1,
    creatorName: 'Riya Sharma',
    creatorPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    lastMessage: 'Sure! I will send you the plan 💪',
    lastTime: '10:30 AM',
    unread: 2,
    messages: [
      { id: 1, text: 'Hi Riya! Can you help me with my diet?', sender: 'user', time: '10:25 AM' },
      { id: 2, text: 'Sure! I will send you the plan 💪', sender: 'creator', time: '10:30 AM' },
    ]
  },
  {
    id: 2,
    creatorId: 2,
    creatorName: 'Arjun Mehta',
    creatorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    lastMessage: 'Keep going! You are doing great 🚀',
    lastTime: 'Yesterday',
    unread: 0,
    messages: [
      { id: 1, text: 'I need some motivation today', sender: 'user', time: 'Yesterday' },
      { id: 2, text: 'Keep going! You are doing great 🚀', sender: 'creator', time: 'Yesterday' },
    ]
  },
]