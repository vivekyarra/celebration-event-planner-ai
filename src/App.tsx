import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Clock,
  Palette,
  UtensilsCrossed,
  Users,
  Briefcase,
  Mic,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { EventHeader } from './components/EventHeader';
import { BudgetManager } from './components/BudgetManager';
import { TimelineRunOfShow } from './components/TimelineRunOfShow';
import { ThemeStudio } from './components/ThemeStudio';
import { CateringMenu } from './components/CateringMenu';
import { GuestTracker } from './components/GuestTracker';
import { VendorDirectory } from './components/VendorDirectory';
import { SpeechStudio } from './components/SpeechStudio';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { DietaryAuditBanner } from './components/DietaryAuditBanner';
import { CommandPalette } from './components/CommandPalette';
import { EventWizardModal } from './components/EventWizardModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { EventPlan, BudgetCategory, TimelineItem, Guest, MenuItem, VendorItem } from './types';
import { createDefaultEventPlan, calculateBudgetBreakdown } from './services/plannerGenerator';

export type ActiveTab =
  | 'budget'
  | 'timeline'
  | 'theme'
  | 'menu'
  | 'guests'
  | 'vendors'
  | 'speech'
  | 'scenarios';

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
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('celebrite_gemini_key') || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  });

  useEffect(() => {
    localStorage.setItem('celebrite_event_plan', JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

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

  const handleAddMenuItem = (item: MenuItem) => {
    setPlan((prev) => ({ ...prev, menu: [item, ...prev.menu] }));
  };

  const handleUpdateVendors = (newVendors: VendorItem[]) => {
    setPlan((prev) => ({ ...prev, vendors: newVendors }));
  };

  const handleApplyScenario = (newBudget: number) => {
    setPlan((prev) => ({
      ...prev,
      totalBudget: newBudget,
      budgetBreakdown: calculateBudgetBreakdown(prev.eventType, newBudget),
    }));
  };

  const handlePaletteAction = (actionId: string) => {
    if (actionId.startsWith('tab-')) {
      const tabName = actionId.replace('tab-', '') as ActiveTab;
      setActiveTab(tabName);
    } else if (actionId === 'act-confetti') {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } else if (actionId === 'act-print') {
      window.print();
    } else if (actionId === 'act-wizard') {
      setIsWizardOpen(true);
    }
  };

  const tabs = [
    { id: 'budget', label: 'Budget Allocator', icon: DollarSign },
    { id: 'timeline', label: 'Run of Show', icon: Clock },
    { id: 'theme', label: 'Theme & Invites', icon: Palette },
    { id: 'menu', label: 'Culinary Menu', icon: UtensilsCrossed },
    { id: 'guests', label: 'Guest List & RSVPs', icon: Users },
    { id: 'vendors', label: 'Vendor Partners', icon: Briefcase },
    { id: 'speech', label: 'Speech & Toasts', icon: Mic },
    { id: 'scenarios', label: 'What-If Scenarios', icon: Layers },
  ] as const;

  return (
    <div className="app-container">
      <Navbar
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onOpenPalette={() => setIsPaletteOpen(true)}
        hasApiKey={Boolean(apiKey)}
      />

      <main className="main-content" role="main">
        <EventHeader plan={plan} />

        {/* Dietary audit notification banner */}
        <DietaryAuditBanner plan={plan} onAddMenuItem={handleAddMenuItem} />

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

          {activeTab === 'speech' && (
            <SpeechStudio plan={plan} />
          )}

          {activeTab === 'scenarios' && (
            <ScenarioSimulator plan={plan} onApplyScenario={handleApplyScenario} />
          )}
        </div>
      </main>

      {/* Floating AI Assistant Drawer */}
      <AIAssistantDrawer plan={plan} apiKey={apiKey} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectAction={handlePaletteAction}
      />

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
