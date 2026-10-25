import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Clock,
  Palette,
  UtensilsCrossed,
  Users,
  Briefcase,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { EventHeader } from './components/EventHeader';
import { BudgetManager } from './components/BudgetManager';
import { TimelineRunOfShow } from './components/TimelineRunOfShow';
import { ThemeStudio } from './components/ThemeStudio';
import { CateringMenu } from './components/CateringMenu';
import { GuestTracker } from './components/GuestTracker';
import { VendorDirectory } from './components/VendorDirectory';
import { EventWizardModal } from './components/EventWizardModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { EventPlan, BudgetCategory, TimelineItem, Guest, MenuItem, VendorItem } from './types';
import { createDefaultEventPlan } from './services/plannerGenerator';

type ActiveTab = 'budget' | 'timeline' | 'theme' | 'menu' | 'guests' | 'vendors';

export const App: React.FC = () => {
  const [plan, setPlan] = useState<EventPlan>(() => {
    const saved = localStorage.getItem('celebrite_event_plan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved plan, loading default', e);
      }
    }
    return createDefaultEventPlan();
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('budget');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('celebrite_gemini_key') || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  });

  useEffect(() => {
    localStorage.setItem('celebrite_event_plan', JSON.stringify(plan));
  }, [plan]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('celebrite_gemini_key', key);
  };

  const handleUpdateBudget = (newCategories: BudgetCategory[]) => {
    setPlan((prev) => ({ ...prev, budgetBreakdown: newCategories }));
  };

  const handleUpdateTimeline = (newTimeline: TimelineItem[]) => {
    setPlan((prev) => ({ ...prev, timeline: newTimeline }));
  };

  const handleUpdateGuests = (newGuests: Guest[]) => {
    setPlan((prev) => ({ ...prev, guests: newGuests }));
  };

  const handleUpdateMenu = (newMenu: MenuItem[]) => {
    setPlan((prev) => ({ ...prev, menu: newMenu }));
  };

  const handleUpdateVendors = (newVendors: VendorItem[]) => {
    setPlan((prev) => ({ ...prev, vendors: newVendors }));
  };

  const tabs = [
    { id: 'budget', label: 'Budget Allocator', icon: DollarSign },
    { id: 'timeline', label: 'Run of Show', icon: Clock },
    { id: 'theme', label: 'Theme & Invites', icon: Palette },
    { id: 'menu', label: 'Culinary Menu', icon: UtensilsCrossed },
    { id: 'guests', label: 'Guest List & RSVPs', icon: Users },
    { id: 'vendors', label: 'Vendor Directory', icon: Briefcase },
  ] as const;

  return (
    <div className="app-container">
      <Navbar
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        hasApiKey={Boolean(apiKey)}
      />

      <main className="main-content" role="main">
        <EventHeader plan={plan} />

        {/* Tab Navigation */}
        <nav className="tab-navigation" aria-label="Event Planning Modules">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                aria-selected={isActive}
                role="tab"
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Module Content Views */}
        <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'budget' && (
            <BudgetManager plan={plan} onUpdateBudget={handleUpdateBudget} />
          )}

          {activeTab === 'timeline' && (
            <TimelineRunOfShow plan={plan} onUpdateTimeline={handleUpdateTimeline} />
          )}

          {activeTab === 'theme' && (
            <ThemeStudio plan={plan} />
          )}

          {activeTab === 'menu' && (
            <CateringMenu plan={plan} onUpdateMenu={handleUpdateMenu} />
          )}

          {activeTab === 'guests' && (
            <GuestTracker plan={plan} onUpdateGuests={handleUpdateGuests} />
          )}

          {activeTab === 'vendors' && (
            <VendorDirectory plan={plan} onUpdateVendors={handleUpdateVendors} />
          )}
        </div>
      </main>

      {/* Floating AI Assistant Drawer */}
      <AIAssistantDrawer plan={plan} apiKey={apiKey} />

      {/* Wizard Modal */}
      <EventWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onPlanCreated={(newPlan) => {
          setPlan(newPlan);
          setActiveTab('budget');
        }}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />
    </div>
  );
};

export default App;
