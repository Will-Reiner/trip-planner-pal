import { useState } from 'react';
import { useTripData } from '../contexts/TripDataContext';
import { useUser } from '../contexts/UserContext';
import { getUserColor } from '../lib/userColors';
import { ChefHat, Droplets, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MealCardProps {
  meal: {
    id: number;
    day: number;
    type: string;
    description: string;
    ingredients: string[];
    chef: number | null;
    dishWashers: (number | null)[];
  };
}

const MealCard: React.FC<MealCardProps> = ({ meal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data, assignChef, assignDishWasher } = useTripData();
  const { currentUser } = useUser();

  const getParticipantName = (id: number | null) => {
    if (!id) return null;
    return data.participants.find(p => p.id === id)?.name;
  };

  const getMealEmoji = (type: string) => {
    switch (type) {
      case 'Café da Manhã': return '☕';
      case 'Almoço': return '🍽️';
      case 'Jantar': return '🌙';
      default: return '🍴';
    }
  };

  const handleVolunteerChef = () => {
    if (currentUser && !meal.chef) {
      assignChef(meal.id, currentUser.id);
    }
  };

  const handleVolunteerDishWasher = (slot: number) => {
    if (currentUser && !meal.dishWashers[slot]) {
      assignDishWasher(meal.id, slot, currentUser.id);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-2xl border border-border overflow-hidden transition-all duration-200 hover:shadow-md">
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getMealEmoji(meal.type)}</span>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">{meal.type}</h3>
              <p className="text-sm text-muted-foreground">{meal.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {meal.chef && (
              <Badge 
                className="text-xs text-white"
                style={{ backgroundColor: getUserColor(meal.chef) }}
              >
                <ChefHat className="w-3 h-3 mr-1" />
                {getParticipantName(meal.chef)}
              </Badge>
            )}
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            {/* Ingredients */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Ingredientes
              </h4>
              <div className="flex flex-wrap gap-2">
                {meal.ingredients.map((ingredient, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Chef */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Chef</span>
              </div>
              {meal.chef ? (
                <Badge 
                  className="text-white"
                  style={{ backgroundColor: getUserColor(meal.chef) }}
                >
                  {getParticipantName(meal.chef)}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleVolunteerChef}
                  className="text-xs"
                >
                  Pode ser eu! 🙋
                </Button>
              )}
            </div>

            {/* Dish Washers */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Droplets className="w-4 h-4 text-accent-foreground" />
                Louça
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {meal.dishWashers.map((washer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                  >
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    {washer ? (
                      <Badge 
                        className="text-xs text-white"
                        style={{ backgroundColor: getUserColor(washer) }}
                      >
                        {getParticipantName(washer)}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleVolunteerDishWasher(index)}
                        className="text-xs h-7"
                      >
                        Eu lavo! 🧽
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default MealCard;
