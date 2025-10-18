import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Bell } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationDays, setNotificationDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);
  const [notificationTime, setNotificationTime] = useState('10:00');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { value: daysData } = await Preferences.get({ key: 'notificationDays' });
      const { value: timeData } = await Preferences.get({ key: 'notificationTime' });

      if (daysData) setNotificationDays(JSON.parse(daysData));
      if (timeData) setNotificationTime(timeData);
    } catch (error: any) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setNotificationDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const scheduleNotifications = async () => {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }] });

    const [hours, minutes] = notificationTime.split(':').map(Number);
    const dayMap: { [key: string]: number } = {
      Sunday: 1, Monday: 2, Tuesday: 3, Wednesday: 4, Thursday: 5, Friday: 6, Saturday: 7
    };

    const notifications = notificationDays.map((day, index) => ({
      id: index + 1,
      title: 'Savings Reminder 💰',
      body: 'Don\'t forget to track your savings today!',
      schedule: {
        on: { weekday: dayMap[day], hour: hours, minute: minutes },
        allowWhileIdle: true
      }
    }));

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  };

  const handleSave = async () => {
    if (notificationDays.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one day for notifications",
      });
      return;
    }

    setSaving(true);
    try {
      await Preferences.set({ key: 'notificationDays', value: JSON.stringify(notificationDays) });
      await Preferences.set({ key: 'notificationTime', value: notificationTime });

      await scheduleNotifications();

      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Customize when you receive savings reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Notification Days</Label>
              <div className="grid grid-cols-2 gap-3">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={notificationDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <label
                      htmlFor={day}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Notification Time</Label>
              <Input
                id="time"
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;