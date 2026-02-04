import { Button } from "@/components/ui/button";

interface Poll {
  id: number;
  titulo: string;
  tipo: string;
  created_at: string;
}

interface PollVotingProps {
  poll: Poll;
  options: string[];
  userVote?: string;
  onVote: (pollId: number, resposta: string) => Promise<void>;
}

export default function PollVoting({ poll, options, userVote, onVote }: PollVotingProps) {
  const handleVote = async (option: string) => {
    await onVote(poll.id, option);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">{poll.titulo}</h3>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <Button
            key={option}
            variant={userVote === option ? "default" : "outline"}
            onClick={() => handleVote(option)}
            className="w-full justify-start text-left"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
