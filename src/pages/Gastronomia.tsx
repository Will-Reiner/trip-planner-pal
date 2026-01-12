import { useState } from 'react';
import { useTripData } from '../contexts/TripDataContext';
import { useUser } from '../contexts/UserContext';
import BottomNav from '../components/BottomNav';
import MealCard from '../components/MealCard';
import DrinkVoting from '../components/DrinkVoting';
import { UtensilsCrossed, Wine, Coffee } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const Gastronomia = () => {
  const { data } = useTripData();
  const { currentUser } = useUser();
  const [selectedDay, setSelectedDay] = useState(14);

  const days = [14, 15, 16, 17];
  const mealsForDay = data.meals.filter(m => m.day === selectedDay);

  const totalAlcoholicVotes = data.drinks.alcoholic.reduce((acc, d) => acc + d.votes.length, 0);
  const totalNonAlcoholicVotes = data.drinks.nonAlcoholic.reduce((acc, d) => acc + d.votes.length, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 to-accent p-6 pt-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Gastronomia</h1>
          </div>
          <p className="text-muted-foreground">
            Olá, {currentUser?.name}! Organize as refeições 🍳
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Day Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 whitespace-nowrap ${
                selectedDay === day
                  ? 'bg-primary text-primary-foreground scale-105 shadow-lg'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              Dia {day}
            </button>
          ))}
        </div>

        {/* Meals */}
        <div className="space-y-4 mb-8">
          {mealsForDay.map(meal => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>

        {/* Drink Voting */}
        <Tabs defaultValue="alcoholic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="alcoholic" className="gap-2">
              <Wine className="w-4 h-4" />
              Alcoólicas
              <Badge variant="secondary" className="ml-1">{totalAlcoholicVotes}</Badge>
            </TabsTrigger>
            <TabsTrigger value="nonAlcoholic" className="gap-2">
              <Coffee className="w-4 h-4" />
              Sem Álcool
              <Badge variant="secondary" className="ml-1">{totalNonAlcoholicVotes}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="alcoholic">
            <DrinkVoting type="alcoholic" drinks={data.drinks.alcoholic} />
          </TabsContent>
          
          <TabsContent value="nonAlcoholic">
            <DrinkVoting type="nonAlcoholic" drinks={data.drinks.nonAlcoholic} />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Gastronomia;
