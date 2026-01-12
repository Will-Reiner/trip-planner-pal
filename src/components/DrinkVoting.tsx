import { useTripData } from '../contexts/TripDataContext';
import { useUser } from '../contexts/UserContext';
import { Check } from 'lucide-react';

interface DrinkVotingProps {
  type: 'alcoholic' | 'nonAlcoholic';
  drinks: {
    id: number;
    name: string;
    emoji: string;
    votes: number[];
  }[];
}

const DrinkVoting: React.FC<DrinkVotingProps> = ({ type, drinks }) => {
  const { voteDrink } = useTripData();
  const { currentUser } = useUser();

  const handleVote = (drinkId: number) => {
    if (currentUser) {
      voteDrink(type, drinkId, currentUser.id);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {drinks.map(drink => {
        const hasVoted = currentUser && drink.votes.includes(currentUser.id);
        return (
          <button
            key={drink.id}
            onClick={() => handleVote(drink.id)}
            className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
              hasVoted
                ? 'border-primary bg-primary/10 scale-[1.02]'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="text-3xl mb-2">{drink.emoji}</div>
            <span className="font-medium text-foreground text-sm">{drink.name}</span>
            <div className="mt-2 flex items-center justify-center gap-1">
              <span className={`text-lg font-bold ${hasVoted ? 'text-primary' : 'text-muted-foreground'}`}>
                {drink.votes.length}
              </span>
              <span className="text-xs text-muted-foreground">votos</span>
            </div>
            {hasVoted && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default DrinkVoting;
