import './Tabs.css';

const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;

