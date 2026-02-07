import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Plus, Bell, Trash2, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

interface Task {
  _id: string;
  title: string;
  type: string;
  priority: string;
  dueDate: string;
  completed: boolean;
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input"; // Ensure Input is imported

export default function Scheduler() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    title: "",
    type: "manual",
    priority: "Medium",
    dueDate: new Date().toISOString().split('T')[0]
  });

  const handleAddTask = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTask.title,
          type: "manual",
          priority: newTask.priority,
          dueDate: new Date(newTask.dueDate),
          relatedDiagnosis: null
        })
      });

      if (res.ok) {
        toast.success("Task added successfully!");
        setNewTask({ ...newTask, title: "" }); // Reset title
        fetchTasks(); // Refresh list
      }
    } catch (error) {
      toast.error("Failed to add task");
    }
  };

  // Fetch Tasks
  const fetchTasks = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5000/api/tasks", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  // Toggle Completion
  const toggleTask = async (taskId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedTask = await res.json();
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, completed: updatedTask.completed } : t));
        if (updatedTask.completed) toast.success("Task completed!");
      }
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  // Delete Task
  const deleteTask = async (taskId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
        toast.success("Task deleted");
      }
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const today = new Date();
  const todaysTasks = tasks.filter(t => new Date(t.dueDate).toDateString() === today.toDateString());
  const upcomingTasks = tasks.filter(t => new Date(t.dueDate) > today);
  const overdueTasks = tasks.filter(t => new Date(t.dueDate) < today && !t.completed && new Date(t.dueDate).toDateString() !== today.toDateString());

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Task Scheduler</h1>
          <p className="text-muted-foreground">
            Manage your farming activities and reminders
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Manual Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Create a custom task for your farm schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Task
                </Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., Water the tomatoes"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Due Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <Select
                  onValueChange={(val) => setNewTask({ ...newTask, priority: val })}
                  defaultValue={newTask.priority}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddTask} disabled={!newTask.title || !newTask.dueDate}>
                Add Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overdue Alerts */}
      {overdueTasks.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-center gap-3">
          <Bell className="w-5 h-5 text-destructive animate-pulse" />
          <div className="flex-1">
            <p className="font-medium text-destructive">You have {overdueTasks.length} overdue tasks!</p>
            <p className="text-sm text-muted-foreground">Please review your schedule.</p>
          </div>
        </div>
      )}

      {/* Unified Plant-Based Timeline */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground py-10">Loading schedule...</p>
        ) : tasks.length > 0 ? (
          Object.entries(
            tasks.reduce((acc, task) => {
              // Group by Plant Name (try relatedDiagnosis -> then parse Title -> then 'General')
              // @ts-ignore
              let plantName = task.relatedDiagnosis?.plant;

              if (!plantName || plantName === "Unknown") {
                // Fallback: Try to find plant name in title (e.g. "Treat Corn for...")
                const plants = [
                  "Apple", "Blueberry", "Cherry", "Corn", "Maize", "Grape", "Orange",
                  "Peach", "Pepper", "Potato", "Raspberry", "Rice", "Soybean", "Squash",
                  "Strawberry", "Tomato", "Wheat"
                ];
                // Check if any plant name is in the title (Case insensitive check better?)
                plantName = plants.find(p => task.title.includes(p)) || "General Tasks";
              }

              if (!acc[plantName]) acc[plantName] = [];
              acc[plantName].push(task);
              return acc;
            }, {} as Record<string, Task[]>)
          ).map(([plant, plantTasks]) => (
            <Card key={plant} className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="text-primary">{plant}</span> Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 border-l border-border space-y-6">
                  {/* Group by Date Category: Overdue, Today, Upcoming */}
                  {['Overdue', 'Today', 'Upcoming'].map((category) => {
                    const categoryTasks = plantTasks.filter(t => {
                      const due = new Date(t.dueDate);
                      const today = new Date();
                      const isToday = due.toDateString() === today.toDateString();
                      const isPast = due < today && !isToday;

                      if (category === 'Overdue') return isPast && !t.completed;
                      if (category === 'Today') return isToday;
                      if (category === 'Upcoming') return due > today;
                      return false;
                    });

                    if (categoryTasks.length === 0) return null;

                    return (
                      <div key={category} className="relative">
                        <span className={`absolute -left-[2.35rem] top-0 w-3 h-3 rounded-full border-2 border-background ${category === 'Overdue' ? 'bg-destructive' : category === 'Today' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                        <h4 className={`text-sm font-semibold mb-3 ${category === 'Overdue' ? 'text-destructive' : 'text-muted-foreground'}`}>{category}</h4>

                        <div className="space-y-3">
                          {categoryTasks.map(task => (
                            <div key={task._id} className={`flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors ${task.completed ? 'opacity-50' : ''}`}>
                              <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task._id)} className="mt-1" />
                              <div className="flex-1">
                                <p className={`font-medium text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(task.dueDate), 'MMM dd')}
                                  <Badge variant="outline" className="text-[10px] h-4 ml-auto">{task.type}</Badge>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteTask(task._id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">No tasks scheduled.</p>
          </div>
        )}
      </div>
    </div>
  );
}
