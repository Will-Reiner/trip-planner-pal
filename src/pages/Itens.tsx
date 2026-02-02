import { useState } from 'react';
import { useTripData } from '../contexts/TripDataContext';
import { useUser } from '../contexts/UserContext';
import BottomNav from '../components/BottomNav';
import { getUserColor } from '../lib/userColors';
import { Package, ClipboardList, AlertCircle, Plus, UserCheck, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

const Itens = () => {
  const { data, addCommunityItem, assignCommunityItem, addTask, assignTask, deleteCommunityItem, deleteTask, addEssential, toggleEssential, deleteEssential } = useTripData();
  const { currentUser } = useUser();
  const [newItem, setNewItem] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newEssential, setNewEssential] = useState('');

  const storedUser = localStorage.getItem('trip_planner_user');
  const isAdmin = storedUser ? JSON.parse(storedUser)?.role === 'admin' : false;

  const getParticipantName = (id: number | null) => {
    if (!id) return null;
    return data.participants.find(p => p.id === id)?.name;
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      addCommunityItem(newItem.trim());
      setNewItem('');
    }
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      addTask(newTask.trim());
      setNewTask('');
    }
  };

  const handleAddEssential = () => {
    if (newEssential.trim()) {
      addEssential(newEssential.trim());
      setNewEssential('');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent to-primary/20 p-6 pt-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-6 h-6 text-accent-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Itens & Tarefas</h1>
          </div>
          <p className="text-muted-foreground">
            Organize tudo para a trip! 📋
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="items" className="text-xs sm:text-sm">
              <Package className="w-4 h-4 mr-1" />
              Quem Leva
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs sm:text-sm">
              <ClipboardList className="w-4 h-4 mr-1" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="essentials" className="text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              Essenciais
            </TabsTrigger>
          </TabsList>

          {/* Community Items */}
          <TabsContent value="items" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar item..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                className="flex-1"
              />
              <Button onClick={handleAddItem} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {data.communityItems.map(item => (
                (() => {
                  const canDelete = isAdmin;
                  return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border"
                >
                  <span className="font-medium text-foreground flex-1">{item.name}</span>
                  {item.assignee ? (
                    <div className="flex items-center gap-2">
                      <Badge 
                        className="text-white"
                        style={{ backgroundColor: getUserColor(item.assignee) }}
                      >
                        <UserCheck className="w-3 h-3 mr-1" />
                        {getParticipantName(item.assignee)}
                      </Badge>
                      {item.assignee === currentUser?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => assignCommunityItem(item.id, null)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => currentUser && assignCommunityItem(item.id, currentUser.id)}
                      >
                        Assumir 🙋
                      </Button>
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCommunityItem(item.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                  {item.assignee && canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCommunityItem(item.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                  );
                })()
              ))}
            </div>
          </TabsContent>

          {/* Tasks */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nova tarefa..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                className="flex-1"
              />
              <Button onClick={handleAddTask} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {data.tasks.map(task => (
                (() => {
                  const canDelete = isAdmin;
                  return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border"
                >
                  <span className="font-medium text-foreground flex-1">{task.name}</span>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Badge 
                        className="text-white"
                        style={{ backgroundColor: getUserColor(task.assignee) }}
                      >
                        <UserCheck className="w-3 h-3 mr-1" />
                        {getParticipantName(task.assignee)}
                      </Badge>
                      {task.assignee === currentUser?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => assignTask(task.id, null)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => currentUser && assignTask(task.id, currentUser.id)}
                      >
                        Assumir 🙋
                      </Button>
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTask(task.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                  {task.assignee && canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTask(task.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                  );
                })()
              ))}
            </div>
          </TabsContent>

          {/* Essentials */}
          <TabsContent value="essentials" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Não esqueça de..."
                value={newEssential}
                onChange={(e) => setNewEssential(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddEssential()}
                className="flex-1"
              />
              <Button onClick={handleAddEssential} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {data.essentials.map(essential => {
                const isCheckedByUser = essential.is_checked_by_user || false;
                const canDelete = isAdmin || essential.created_by_id === currentUser?.id;
                return (
                  <div
                    key={essential.id}
                    className={`flex items-center gap-3 p-4 bg-card rounded-2xl border border-border transition-all ${
                      isCheckedByUser ? 'opacity-60' : ''
                    }`}
                  >
                    <Checkbox
                      checked={isCheckedByUser}
                      onCheckedChange={() => toggleEssential(essential.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className={`font-medium text-foreground flex-1 ${
                      isCheckedByUser ? 'line-through' : ''
                    }`}>
                      {essential.name}
                    </span>
                    {isCheckedByUser && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEssential(essential.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Itens;
