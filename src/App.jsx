import React from 'react';
import Header from './components/Header';
import CategoryChips from './components/CategoryChips';
import PostCard from './components/PostCard';
import BottomNavigation from './components/BottomNavigation';
import FloatingActionButton from './components/FloatingActionButton';

const samplePosts = [
  {
    id: 1,
    author: 'Anonymous',
    timestamp: '2h ago',
    department: 'Engineering Dept',
    avatar: 'person_off',
    avatarColor: 'gray',
    content: 'Has anyone figured out the lab report for CHEM 101? I\'m completely lost on the results section. The professor\'s instructions were super vague...',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo3T1GzPITVcdbZxlrDjzbzZieCie9_mW6UiczatHpj2dgyOxPCbcNFk39nnV47pqdFTTiMui5HQargWcqHZV3999MiAbCueErEYvFJ-3Q11HV9Tno4VY0uppA2fRLZ5g1fECGurnSEk5e4DMpmyM9lxHvnqIPebrNH8e8zBkS4LtjVeO2nEKFUF5_2aWnpt3DwmEoDk0i9IoNdEPmn6PqC4o6k6iZv4VVFV0FWexigxPmR8r2sKgBCjBRhmFC6w5miwy_puN0tA63',
    likes: 24,
    comments: 8,
    shares: 2,
    isLiked: false
  },
  {
    id: 2,
    author: 'Anonymous',
    timestamp: '4h ago',
    department: 'Freshman',
    avatar: 'psychology',
    avatarColor: 'primary',
    content: 'The dining hall pizza is actually getting better this semester or am I just starving? Yesterday\'s BBQ chicken slice was actually... edible? 🍕',
    likes: 152,
    comments: 43,
    shares: 12,
    isLiked: true
  },
  {
    id: 3,
    author: 'Anonymous',
    timestamp: '6h ago',
    department: 'Main Campus',
    avatar: 'person_off',
    avatarColor: 'gray',
    content: 'Sunset from the 4th floor library is unmatched. This is your sign to take a break and look out the window.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOnHfCCjusYTOOGK1eimwUEVpesIb879S5SGU0NIPIL4hZXxWRvglfldyZQNIuaCSbOahIHzFnFr4ImAm6q_YaDSNX4kCZouetzbZXJAKDJf99TI7JkogrQcn4P4vmDoryJ3fCPgtpPVcpuzYnDWxLW-Z4U4sqv0EU_BZD3wX5OpdXk2jI294FWoevXcBZ6H0uoKWYQTtKYCLPiyu4Q1IvROwO3wr1kOGo354vVZJfap3sngJGDtCl-stESKeUP7nW81sIqK9Ix8hC',
    likes: 312,
    comments: 18,
    shares: 45,
    isLiked: false
  }
];

const categories = [
  { name: 'Feed', isActive: true },
  { name: 'Engineering', isActive: false },
  { name: 'Freshman', isActive: false },
  { name: 'Clubs', isActive: false }
];

function App() {
  return (
    <div className="min-h-screen bg-[#f8f6f5] font-sans text-[#181311] antialiased">
      <Header />
      
      <main className="max-w-md mx-auto pb-24">
        <CategoryChips categories={categories} />
        
        <div className="flex flex-col gap-4 px-4">
          {samplePosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
      
      <FloatingActionButton />
      <BottomNavigation />
    </div>
  );
}

export default App;