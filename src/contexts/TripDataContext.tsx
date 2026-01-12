import React, { createContext, useContext, useState, ReactNode } from 'react';
import initialData from '../data/tripData.json';

interface Participant {
  id: number;
  name: string;
  photo: string | null;
  title: string;
}

interface Meal {
  id: number;
  day: number;
  type: string;
  description: string;
  ingredients: string[];
  chef: number | null;
  dishWashers: (number | null)[];
}

interface Drink {
  id: number;
  name: string;
  emoji: string;
  votes: number[];
}

interface Item {
  id: number;
  name: string;
  assignee: number | null;
}

interface Task {
  id: number;
  name: string;
  assignee: number | null;
}

interface Essential {
  id: number;
  name: string;
  checked: boolean;
}

interface PartyTheme {
  id: number;
  name: string;
  emoji: string;
  votes: number[];
}

interface Quote {
  id: number;
  text: string;
  author: number;
}

interface TripData {
  participants: Participant[];
  meals: Meal[];
  drinks: {
    alcoholic: Drink[];
    nonAlcoholic: Drink[];
  };
  communityItems: Item[];
  tasks: Task[];
  essentials: Essential[];
  partyThemes: PartyTheme[];
  quotes: Quote[];
}

interface TripDataContextType {
  data: TripData;
  updateParticipant: (id: number, updates: Partial<Participant>) => void;
  assignChef: (mealId: number, userId: number) => void;
  assignDishWasher: (mealId: number, slot: number, userId: number) => void;
  voteDrink: (type: 'alcoholic' | 'nonAlcoholic', drinkId: number, userId: number) => void;
  addCommunityItem: (name: string) => void;
  assignCommunityItem: (itemId: number, userId: number) => void;
  addTask: (name: string) => void;
  assignTask: (taskId: number, userId: number) => void;
  addEssential: (name: string) => void;
  toggleEssential: (essentialId: number) => void;
  votePartyTheme: (themeId: number, userId: number) => void;
  addQuote: (text: string, authorId: number) => void;
}

const TripDataContext = createContext<TripDataContextType | undefined>(undefined);

export const TripDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<TripData>(initialData as TripData);

  const updateParticipant = (id: number, updates: Partial<Participant>) => {
    setData(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    }));
  };

  const assignChef = (mealId: number, userId: number) => {
    setData(prev => ({
      ...prev,
      meals: prev.meals.map(m =>
        m.id === mealId ? { ...m, chef: userId } : m
      )
    }));
  };

  const assignDishWasher = (mealId: number, slot: number, userId: number) => {
    setData(prev => ({
      ...prev,
      meals: prev.meals.map(m => {
        if (m.id === mealId) {
          const newDishWashers = [...m.dishWashers];
          newDishWashers[slot] = userId;
          return { ...m, dishWashers: newDishWashers };
        }
        return m;
      })
    }));
  };

  const voteDrink = (type: 'alcoholic' | 'nonAlcoholic', drinkId: number, userId: number) => {
    setData(prev => ({
      ...prev,
      drinks: {
        ...prev.drinks,
        [type]: prev.drinks[type].map(d => {
          if (d.id === drinkId) {
            const hasVoted = d.votes.includes(userId);
            return {
              ...d,
              votes: hasVoted
                ? d.votes.filter(v => v !== userId)
                : [...d.votes, userId]
            };
          }
          return d;
        })
      }
    }));
  };

  const addCommunityItem = (name: string) => {
    setData(prev => ({
      ...prev,
      communityItems: [
        ...prev.communityItems,
        { id: Date.now(), name, assignee: null }
      ]
    }));
  };

  const assignCommunityItem = (itemId: number, userId: number) => {
    setData(prev => ({
      ...prev,
      communityItems: prev.communityItems.map(item =>
        item.id === itemId ? { ...item, assignee: userId } : item
      )
    }));
  };

  const addTask = (name: string) => {
    setData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: Date.now(), name, assignee: null }]
    }));
  };

  const assignTask = (taskId: number, userId: number) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, assignee: userId } : task
      )
    }));
  };

  const addEssential = (name: string) => {
    setData(prev => ({
      ...prev,
      essentials: [...prev.essentials, { id: Date.now(), name, checked: false }]
    }));
  };

  const toggleEssential = (essentialId: number) => {
    setData(prev => ({
      ...prev,
      essentials: prev.essentials.map(e =>
        e.id === essentialId ? { ...e, checked: !e.checked } : e
      )
    }));
  };

  const votePartyTheme = (themeId: number, userId: number) => {
    setData(prev => ({
      ...prev,
      partyThemes: prev.partyThemes.map(t => {
        if (t.id === themeId) {
          const hasVoted = t.votes.includes(userId);
          return {
            ...t,
            votes: hasVoted
              ? t.votes.filter(v => v !== userId)
              : [...t.votes, userId]
          };
        }
        return t;
      })
    }));
  };

  const addQuote = (text: string, authorId: number) => {
    setData(prev => ({
      ...prev,
      quotes: [...prev.quotes, { id: Date.now(), text, author: authorId }]
    }));
  };

  return (
    <TripDataContext.Provider value={{
      data,
      updateParticipant,
      assignChef,
      assignDishWasher,
      voteDrink,
      addCommunityItem,
      assignCommunityItem,
      addTask,
      assignTask,
      addEssential,
      toggleEssential,
      votePartyTheme,
      addQuote
    }}>
      {children}
    </TripDataContext.Provider>
  );
};

export const useTripData = () => {
  const context = useContext(TripDataContext);
  if (context === undefined) {
    throw new Error('useTripData must be used within a TripDataProvider');
  }
  return context;
};
