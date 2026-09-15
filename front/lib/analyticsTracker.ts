export interface ActivityItem {
  id: string;
  type: 'view' | 'shortlist' | 'request' | 'publish' | 'general';
  title: string;
  detail?: string;
  time: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  VIEWS: 'teachconnect_profile_views',
  SHORTLIST: 'teachconnect_school_shortlist',
  TEACHER_ACTIVITY: 'teachconnect_teacher_activity',
  SCHOOL_ACTIVITY: 'teachconnect_school_activity',
};

// 1. Record Profile View
export function recordProfileView(slugOrId: string) {
  if (typeof window === 'undefined' || !slugOrId) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VIEWS);
    const views: Record<string, { total: number; timestamps: number[] }> = raw ? JSON.parse(raw) : {};

    const now = Date.now();
    const current = views[slugOrId] || { total: 0, timestamps: [] };

    // Prevent duplicate views within 10 seconds for the same session
    const lastView = current.timestamps[current.timestamps.length - 1];
    if (lastView && now - lastView < 10000) {
      return;
    }

    current.total += 1;
    current.timestamps.push(now);
    if (current.timestamps.length > 100) {
      current.timestamps = current.timestamps.slice(-100);
    }
    views[slugOrId] = current;
    localStorage.setItem(STORAGE_KEYS.VIEWS, JSON.stringify(views));

    // Also add to teacher activity
    addActivity('teacher', {
      type: 'view',
      title: 'A school discovered and viewed your Teacher Card',
      detail: 'Profile viewed from teacher search results',
    });
  } catch (e) {
    console.error('Failed to record local profile view:', e);
  }
}

// 2. Get Profile View Stats
export function getProfileViewStats(slugOrId?: string): { totalViews: number; thisWeekViews: number } {
  if (typeof window === 'undefined') return { totalViews: 0, thisWeekViews: 0 };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VIEWS);
    if (!raw) return { totalViews: 0, thisWeekViews: 0 };
    const views: Record<string, { total: number; timestamps: number[] }> = JSON.parse(raw);

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    if (slugOrId) {
      const item = views[slugOrId];
      if (!item) {
        return { totalViews: 0, thisWeekViews: 0 };
      }
      const thisWeek = item.timestamps.filter((t) => t >= oneWeekAgo).length;
      return { totalViews: item.total, thisWeekViews: thisWeek };
    }

    let total = 0;
    let thisWeek = 0;
    Object.values(views).forEach((item) => {
      total += item.total;
      thisWeek += item.timestamps.filter((t) => t >= oneWeekAgo).length;
    });

    return { totalViews: total, thisWeekViews: thisWeek };
  } catch {
    return { totalViews: 0, thisWeekViews: 0 };
  }
}

// 3. Shortlist Management
export function toggleShortlist(teacher: any): boolean {
  if (typeof window === 'undefined' || !teacher) return false;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHORTLIST);
    let shortlist: any[] = raw ? JSON.parse(raw) : [];

    const existingIndex = shortlist.findIndex((t) => t.id === teacher.id || (t.slug && t.slug === teacher.slug));

    if (existingIndex >= 0) {
      shortlist.splice(existingIndex, 1);
      localStorage.setItem(STORAGE_KEYS.SHORTLIST, JSON.stringify(shortlist));
      return false;
    } else {
      shortlist.push(teacher);
      localStorage.setItem(STORAGE_KEYS.SHORTLIST, JSON.stringify(shortlist));

      addActivity('teacher', {
        type: 'shortlist',
        title: 'A registered school added your profile to their shortlist',
        detail: 'Shortlisted for potential hiring consideration',
      });

      addActivity('school', {
        type: 'shortlist',
        title: `Shortlisted educator: ${teacher.fullName}`,
        detail: `${teacher.highestEducation || 'Teacher'} - ${teacher.location?.area || 'Karachi'}`,
      });

      return true;
    }
  } catch (e) {
    console.error('Failed to toggle shortlist:', e);
    return false;
  }
}

export function getShortlistedTeachers(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHORTLIST);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isTeacherShortlisted(idOrSlug: string): boolean {
  if (typeof window === 'undefined' || !idOrSlug) return false;
  try {
    const list = getShortlistedTeachers();
    return list.some((t) => t.id === idOrSlug || t.slug === idOrSlug);
  } catch {
    return false;
  }
}

// 4. Activity Log
export function addActivity(role: 'teacher' | 'school', activity: { type: ActivityItem['type']; title: string; detail?: string }) {
  if (typeof window === 'undefined') return;

  try {
    const key = role === 'teacher' ? STORAGE_KEYS.TEACHER_ACTIVITY : STORAGE_KEYS.SCHOOL_ACTIVITY;
    const raw = localStorage.getItem(key);
    let list: ActivityItem[] = raw ? JSON.parse(raw) : [];

    const newItem: ActivityItem = {
      id: 'act-' + Math.random().toString(36).substring(2, 8),
      type: activity.type,
      title: activity.title,
      detail: activity.detail,
      time: 'Just now',
      timestamp: Date.now(),
    };

    list = [newItem, ...list.slice(0, 19)];
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to add activity:', e);
  }
}

export function getActivities(role: 'teacher' | 'school'): ActivityItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = role === 'teacher' ? STORAGE_KEYS.TEACHER_ACTIVITY : STORAGE_KEYS.SCHOOL_ACTIVITY;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const list: ActivityItem[] = JSON.parse(raw);

    return list.map((item) => {
      const diffMinutes = Math.floor((Date.now() - item.timestamp) / 60000);
      let timeText = 'Just now';
      if (diffMinutes >= 1440) {
        timeText = `${Math.floor(diffMinutes / 1440)}d ago`;
      } else if (diffMinutes >= 60) {
        timeText = `${Math.floor(diffMinutes / 60)}h ago`;
      } else if (diffMinutes > 0) {
        timeText = `${diffMinutes}m ago`;
      }
      return { ...item, time: timeText };
    });
  } catch {
    return [];
  }
}
