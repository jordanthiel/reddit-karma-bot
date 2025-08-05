import { useEffect, useState } from "react";
import { fetchMetrics, fetchComments } from "./api";
import { 
  Chart, 
  BarElement, 
  CategoryScale, 
  LinearScale, 
  ArcElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

Chart.register(
  BarElement, 
  CategoryScale, 
  LinearScale, 
  ArcElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
);

function App() {
  const [metrics, setMetrics] = useState({});
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Set default dates (last 7 days)
  const getDefaultDates = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      from_date: weekAgo.toISOString().split('T')[0],
      to_date: today.toISOString().split('T')[0],
      platform: ""
    };
  };
  
  const [filters, setFilters] = useState(getDefaultDates());

  useEffect(() => {
    loadMetrics();
    loadComments();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await fetchMetrics(filters);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
    setLoading(false);
  };

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const data = await fetchComments(filters);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
    setCommentsLoading(false);
  };

  const applyFilters = async () => {
    await loadMetrics();
    await loadComments();
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleCommentClick = (comment) => {
    setSelectedComment(comment);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedComment(null);
  };

  const platforms = Object.keys(metrics);
  const allActions = new Set();
  platforms.forEach(platform => {
    Object.keys(metrics[platform] || {}).forEach(action => allActions.add(action));
  });

  const actionTypes = Array.from(allActions);

  // Success rate calculation
  const getSuccessRate = (platform) => {
    const platformData = metrics[platform] || {};
    const totalActions = Object.values(platformData).reduce((sum, count) => sum + count, 0);
    const successfulActions = platformData.comment_posted || 0;
    return totalActions > 0 ? (successfulActions / totalActions * 100).toFixed(1) : 0;
  };

  // Modern color palette
  const colors = {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    danger: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    dark: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)'
  };

  // Chart configurations with modern styling
  const barChartData = {
    labels: platforms,
    datasets: actionTypes.map((action, index) => ({
      label: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      data: platforms.map(p => metrics[p]?.[action] || 0),
      backgroundColor: `hsla(${200 + index * 40}, 70%, 60%, 0.8)`,
      borderColor: `hsla(${200 + index * 40}, 70%, 50%, 1)`,
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }))
  };

  const successRateData = {
    labels: platforms,
    datasets: [{
      label: 'Success Rate (%)',
      data: platforms.map(p => getSuccessRate(p)),
      backgroundColor: 'rgba(75, 192, 192, 0.8)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 3,
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const doughnutData = {
    labels: actionTypes.map(action => action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
    datasets: [{
      data: actionTypes.map(action => 
        platforms.reduce((sum, platform) => sum + (metrics[platform]?.[action] || 0), 0)
      ),
      backgroundColor: actionTypes.map((_, index) => `hsla(${180 + index * 60}, 70%, 60%, 0.8)`),
      borderWidth: 3,
      borderColor: '#fff',
      hoverBorderWidth: 5,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      title: {
        display: true,
        text: 'Bot Activity Overview',
        font: {
          size: 16,
          weight: '600'
        },
        padding: 20
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    }
  };

  const successRateOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      title: {
        display: true,
        text: 'Success Rate by Platform',
        font: {
          size: 16,
          weight: '600'
        },
        padding: 20
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0,0,0,0.05)',
          drawBorder: false
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          },
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: '500'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          padding: '2rem',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          Loading metrics...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#2c3e50'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        padding: '2rem',
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '3rem', 
          fontWeight: '700',
          background: 'linear-gradient(45deg, #fff, #f0f0f0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          🤖 Social Engagement Bot
        </h1>
        <p style={{ 
          margin: '1rem 0 0 0', 
          opacity: 0.9,
          fontSize: '1.1rem',
          fontWeight: '300'
        }}>
          Real-time analytics dashboard for automated social media engagement
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        padding: '2rem',
        margin: '2rem',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h3 style={{ 
          margin: '0 0 1.5rem 0', 
          color: '#2c3e50',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          📊 Analytics Filters
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1.5rem', 
          alignItems: 'end' 
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              From Date
            </label>
            <input 
              type="date" 
              value={filters.from_date}
              onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e8ed',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e8ed';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              To Date
            </label>
            <input 
              type="date" 
              value={filters.to_date}
              onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e8ed',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e8ed';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Platform
            </label>
            <select 
              value={filters.platform} 
              onChange={e => setFilters(f => ({ ...f, platform: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e8ed',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e8ed';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">All Platforms</option>
              <option value="reddit">Reddit</option>
            </select>
          </div>
          <button 
            onClick={applyFilters}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            }}
          >
            🔄 Apply Filters
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem', 
        margin: '2rem',
        marginBottom: '1rem'
      }}>
        {platforms.map((platform, index) => (
          <div key={platform} style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
          }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${index % 2 === 0 ? '#667eea' : '#f093fb'} 0%, ${index % 2 === 0 ? '#764ba2' : '#f5576c'} 100%)`
            }} />
            <h3 style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#2c3e50', 
              textTransform: 'capitalize',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              📱 {platform}
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {Object.entries(metrics[platform] || {}).map(([action, count]) => (
                <div key={action} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'rgba(102, 126, 234, 0.05)',
                  borderRadius: '10px',
                  border: '1px solid rgba(102, 126, 234, 0.1)'
                }}>
                  <span style={{ 
                    color: '#2c3e50',
                    fontWeight: '500'
                  }}>
                    {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span style={{ 
                    fontWeight: '700', 
                    color: '#667eea',
                    fontSize: '1.1rem'
                  }}>
                    {count}
                  </span>
                </div>
              ))}
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '15px',
                textAlign: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '1.1rem'
              }}>
                Success Rate: {getSuccessRate(platform)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ margin: '2rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
          gap: '2rem' 
        }}>
          {/* Activity Overview */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            height: '400px'
          }}>
            <h3 style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#2c3e50',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              📈 Activity Overview
            </h3>
            <div style={{ height: '300px' }}>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>

          {/* Success Rate */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            height: '400px'
          }}>
            <h3 style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#2c3e50',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              🎯 Success Rate
            </h3>
            <div style={{ height: '300px' }}>
              <Bar data={successRateData} options={successRateOptions} />
            </div>
          </div>

          {/* Action Distribution */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            height: '400px'
          }}>
            <h3 style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#2c3e50',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              🥧 Action Distribution
            </h3>
            <div style={{ height: '300px' }}>
              <Doughnut data={doughnutData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div style={{ 
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        padding: '2rem',
        margin: '2rem',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h3 style={{ 
          margin: '0 0 1.5rem 0', 
          color: '#2c3e50',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          💬 Comments
        </h3>
        {commentsLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No comments found for the selected date range.
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {comments.map((comment, index) => (
              <div key={comment.id} style={{ 
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                padding: '1rem',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleCommentClick(comment)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#2c3e50' }}>
                      {comment.subreddit}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#666' }}>
                      {truncateText(comment.post_title, 80)}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>
                      {truncateText(comment.comment_text, 150)}
                    </p>
                  </div>
                  <div style={{ 
                    textAlign: 'right', 
                    fontSize: '0.8rem',
                    color: '#666',
                    marginLeft: '1rem'
                  }}>
                    <div>{comment.platform}</div>
                    <div>{formatTimestamp(comment.timestamp)}</div>
                    <div style={{ 
                      color: comment.success ? '#4facfe' : '#fa709a',
                      fontWeight: '600'
                    }}>
                      {comment.success ? '✅ Success' : '❌ Failed'}
                    </div>
                  </div>
                </div>
                {comment.error && (
                  <div style={{ 
                    background: 'rgba(250, 112, 154, 0.1)',
                    border: '1px solid rgba(250, 112, 154, 0.3)',
                    borderRadius: '5px',
                    padding: '0.5rem',
                    marginTop: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#d63031'
                  }}>
                    Error: {comment.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Details Modal */}
      {showModal && selectedComment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}
        onClick={closeModal}
        >
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(250, 112, 154, 0.9)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.9)';
                e.target.style.color = 'black';
              }}
            >
              ×
            </button>

            <h2 style={{
              margin: '0 0 1.5rem 0',
              color: '#2c3e50',
              fontSize: '1.8rem',
              fontWeight: '700',
              textAlign: 'center'
            }}>
              💬 Comment Details
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Platform & Status */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '12px'
              }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#2c3e50' }}>
                    Platform: {selectedComment.platform}
                  </span>
                </div>
                <div style={{
                  color: selectedComment.success ? '#4facfe' : '#fa709a',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}>
                  {selectedComment.success ? '✅ Success' : '❌ Failed'}
                </div>
              </div>

              {/* Subreddit */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontWeight: '600' }}>
                  📍 Subreddit
                </h3>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '10px',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  fontWeight: '500'
                }}>
                  {selectedComment.subreddit}
                </div>
              </div>

              {/* Post Title */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontWeight: '600' }}>
                  📝 Post Title
                </h3>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '10px',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  lineHeight: '1.5'
                }}>
                  {selectedComment.post_title}
                </div>
              </div>

              {/* Comment Text */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontWeight: '600' }}>
                  💭 Comment
                </h3>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '10px',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {selectedComment.comment_text}
                </div>
              </div>

              {/* Timestamp */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontWeight: '600' }}>
                  🕒 Timestamp
                </h3>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '10px',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  fontFamily: 'monospace'
                }}>
                  {formatTimestamp(selectedComment.timestamp)}
                </div>
              </div>

              {/* Action Type */}
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontWeight: '600' }}>
                  🔧 Action Type
                </h3>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '10px',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  textTransform: 'capitalize',
                  fontWeight: '500'
                }}>
                  {selectedComment.action_type.replace(/_/g, ' ')}
                </div>
              </div>

              {/* Error Message (if any) */}
              {selectedComment.error && (
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#d63031', fontWeight: '600' }}>
                    ⚠️ Error
                  </h3>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(250, 112, 154, 0.1)',
                    borderRadius: '10px',
                    border: '1px solid rgba(250, 112, 154, 0.3)',
                    color: '#d63031',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem'
                  }}>
                    {selectedComment.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        color: 'white',
        padding: '2rem',
        textAlign: 'center',
        marginTop: '2rem',
        borderTop: '1px solid rgba(255,255,255,0.2)'
      }}>
        <p style={{ 
          margin: 0, 
          opacity: 0.9,
          fontSize: '1rem',
          fontWeight: '300'
        }}>
          Social Engagement Bot Dashboard • Real-time monitoring and analytics
        </p>
      </div>
    </div>
  );
}

export default App;
