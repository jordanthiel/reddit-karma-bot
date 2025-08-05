const API_BASE_URL = 'http://localhost:8000';

export async function fetchMetrics(filters = {}) {
  try {
    // Modify date filters to include full day range
    const modifiedFilters = { ...filters };

    if (modifiedFilters.from_date) {
      // Set to start of day (00:00:00)
      modifiedFilters.from_date = `${modifiedFilters.from_date}T00:00:00`;
    }

    if (modifiedFilters.to_date) {
      // Set to end of day (23:59:59)
      modifiedFilters.to_date = `${modifiedFilters.to_date}T23:59:59`;
    }

    const params = new URLSearchParams(modifiedFilters).toString();
    const response = await fetch(`${API_BASE_URL}/metrics?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching metrics:', error);
    throw error;
  }
}

export async function fetchComments(filters = {}) {
  try {
    // Modify date filters to include full day range
    const modifiedFilters = { ...filters };

    if (modifiedFilters.from_date) {
      // Set to start of day (00:00:00)
      modifiedFilters.from_date = `${modifiedFilters.from_date}T00:00:00`;
    }

    if (modifiedFilters.to_date) {
      // Set to end of day (23:59:59)
      modifiedFilters.to_date = `${modifiedFilters.to_date}T23:59:59`;
    }

    const params = new URLSearchParams(modifiedFilters).toString();
    const response = await fetch(`${API_BASE_URL}/comments?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function fetchRecentActivity(limit = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/recent-activity?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

export async function fetchPlatformStats(platform) {
  try {
    const response = await fetch(`${API_BASE_URL}/platform-stats?platform=${platform}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return {};
  }
}
