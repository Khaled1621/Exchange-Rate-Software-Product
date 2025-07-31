import React, { useState, useEffect, useContext } from 'react';
import './StatisticsModal.css';
import { ThemeContext } from '../App';

const SERVER_URL = "http://127.0.0.1:5000";

function StatisticsModal({ open, onClose }) {
  const { themeMode } = useContext(ThemeContext);
  const isDarkMode = themeMode === 'dark';

  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchStats = async () => {
    try {
      // Only include dates in query params if they're not empty
      const params = {};
      if (dateRange.startDate) params.start_date = dateRange.startDate;
      if (dateRange.endDate) params.end_date = dateRange.endDate;

      const queryParams = new URLSearchParams(params).toString();
      const url = `${SERVER_URL}/rate/statistics${queryParams ? `?${queryParams}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchStats();
  };

  useEffect(() => {
    if (open) {
      fetchStats();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className={`statistics-modal ${isDarkMode ? 'dark-mode' : ''}`}>
        <h2>Exchange Rate Statistics</h2>

        <div className="date-filters">
          <input
            type="date"
            className={isDarkMode ? 'dark-mode-input' : ''}
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
          <input
            type="date"
            className={isDarkMode ? 'dark-mode-input' : ''}
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
          <button
            className={isDarkMode ? 'dark-mode-button' : ''}
            onClick={handleApplyFilters}
          >
            Apply Filters
          </button>
        </div>

        {stats && (
          <div className="stats-grid">
            <div className={`stat-card ${isDarkMode ? 'dark-mode' : ''}`}>
              <h3>Transaction Summary</h3>
              <p>Total Transactions: {stats.total_transactions}</p>
              <p>USD to LBP: {stats.usd_to_lbp_count} ({stats.usd_to_lbp_percentage?.toFixed(1)}%)</p>
              <p>LBP to USD: {stats.lbp_to_usd_count} ({stats.lbp_to_usd_percentage?.toFixed(1)}%)</p>
            </div>

            <div className={`stat-card ${isDarkMode ? 'dark-mode' : ''}`}>
              <h3>Amount Totals</h3>
              <p>Total USD: ${stats.total_usd_amount?.toLocaleString()}</p>
              <p>Total LBP: {stats.total_lbp_amount?.toLocaleString()} LBP</p>
            </div>

            <div className={`stat-card ${isDarkMode ? 'dark-mode' : ''}`}>
              <h3>USD to LBP Rates</h3>
              <p>Average: {stats.average_usd_to_lbp_rate?.toFixed(2)}</p>
              <p>Maximum: {stats.max_usd_to_lbp_rate?.toFixed(2)}</p>
              <p>Minimum: {stats.min_usd_to_lbp_rate?.toFixed(2)}</p>
            </div>

            <div className={`stat-card ${isDarkMode ? 'dark-mode' : ''}`}>
              <h3>LBP to USD Rates</h3>
              <p>Average: {stats.average_lbp_to_usd_rate?.toFixed(2)}</p>
              <p>Maximum: {stats.max_lbp_to_usd_rate?.toFixed(2)}</p>
              <p>Minimum: {stats.min_lbp_to_usd_rate?.toFixed(2)}</p>
            </div>
          </div>
        )}

        <button
          className={`close-button ${isDarkMode ? 'dark-mode' : ''}`}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default StatisticsModal;
