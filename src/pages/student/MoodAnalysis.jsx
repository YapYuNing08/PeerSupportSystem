import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase-config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, startOfMonth, endOfMonth, addMonths, getDate, isAfter, getDaysInMonth } from "date-fns";
import "./MoodAnalysis.css"; 
import StudentLayout from "../../components/layout/StudentLayout"; 
import { useNavigate } from "react-router-dom";



const moodConfig = {
  1: { label: "Awful", color: "#FF6B6B", icon: "😡" },
  2: { label: "Bad", color: "#6A9CFF", icon: "😞" },
  3: { label: "Neutral", color: "#A8A8A8", icon: "😐" },
  4: { label: "Good", color: "#FF9F43", icon: "🙂" }, 
  5: { label: "Great", color: "#6BCB77", icon: "🤩" }
};

const MoodAnalysis = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({});
  const [showIntervention, setShowIntervention] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const INTERVENTION_DISMISSED_KEY = "moodInterventionDismissed";



  // store the user in state so React knows when they are ready
  const [user, setUser] = useState(null);

  // wait for auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // triggers the data fetch when auth is ready
    });
    return () => unsubscribe();
  }, []);

  
  const handleMonthChange = (offset) => {
    const newDate = addMonths(currentDate, offset);
    if (isAfter(startOfMonth(newDate), new Date())) return;
    setCurrentDate(newDate);
  };

  // fetch the data
  useEffect(() => {
    const fetchMonthData = async () => {
      if (!auth.currentUser) return;
      setLoading(true);

      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      // Firestore dates format = "YYYY-MM-DD"
      const startStr = format(start, "yyyy-MM-01");
      const endStr = format(end, "yyyy-MM-31");

      try {
        const q = query(
          collection(db, "mood_logs"),
          where("userId", "==", auth.currentUser.uid),
          where("date", ">=", startStr),
          where("date", "<=", endStr),
          orderBy("date", "asc") 
        );

        const querySnapshot = await getDocs(q);
        // 1. filter to keep only the LATEST mood per day
        const dailyLatest = {}; 

        querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dayOfMonth = getDate(new Date(data.date)); 
        
        // 2. since query is ordered by date ASC, this overwrites older logs for the same day to get the latest log
        dailyLatest[dayOfMonth] = data.mood; 
        });

        // 3. convert that dictionary back into the array format Recharts needs
        const uniqueLogs = Object.keys(dailyLatest).map((day) => ({
        day: Number(day),
        mood: dailyLatest[day]
        }));

        // 4. set the chart data
        setChartData(uniqueLogs);

        const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalLogs = uniqueLogs.length;

        uniqueLogs.forEach(log => {
            if (moodCounts[log.mood] !== undefined) {
                moodCounts[log.mood]++;
            }
        });

        const calculatedStats = {};
        Object.keys(moodCounts).forEach(key => {
            const count = moodCounts[key];
            calculatedStats[key] = totalLogs > 0 ? ((count / totalLogs) * 100).toFixed(1) : 0;
        });
        setStats(calculatedStats);

        // intervention trigger logic: 
        // 1. get only the last 7 logs (or fewer if they haven't logged 7 times yet)
        const recentLogs = uniqueLogs.slice(-7); 
        // 2. count negative logs in this recent batch
        let recentNegatives = 0;
        recentLogs.forEach(log => {
            if (log.mood <= 2) recentNegatives++; // Mood awful(1) or bad(2)
        });
        // 3. trigger if already have enough recent data AND > 50% are negative
        const isRecentCrisis = 
           recentLogs.length >= 7 && 
           (recentNegatives / recentLogs.length >= 0.5);
        
        if (!isRecentCrisis) {
           localStorage.removeItem(INTERVENTION_DISMISSED_KEY);
        }   
        const dismissed = localStorage.getItem(INTERVENTION_DISMISSED_KEY) === "true";
        setShowIntervention(isRecentCrisis && !dismissed);
      } catch (error) {
        console.error("Error fetching mood analytics:", error);
      }
      setLoading(false);
    };

    fetchMonthData();
  }, [currentDate, user]);

  // renderers

  return (
    <StudentLayout>
    <div className="analysis-container">
      {/* header */}
      <header className="analysis-header">
        <h1>ANALYSIS</h1>
        <h2>Monthly Report</h2>
        
        <div className="month-navigator">
          <button onClick={() => handleMonthChange(-1)} className="nav-arrow">
            ←
          </button>
          <span className="current-month">
            {format(currentDate, "MMM yyyy").toUpperCase()}
          </span>
          <button 
            onClick={() => handleMonthChange(1)} 
            className="nav-arrow"
            disabled={isAfter(startOfMonth(addMonths(currentDate, 1)), new Date())}
          >
            →
          </button>
        </div>
      </header>

      {/* chart section */}
      <div className="card chart-card">
        <h3>Mood Flow</h3>
        <div className="chart-wrapper">
          {/* calculate month and days */}
          {(() => {
            const totalDays = getDaysInMonth(currentDate);
            const currentMonthStr = format(currentDate, "M"); // e.g., "9" or "12"
            
            return (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                  <XAxis 
                    type="number"               // real timeline
                    dataKey="day" 
                    domain={[1, totalDays]}     //forces axis to go 1 to 31
                    padding={{ left: 15, right: 15 }}
                    tickCount={6}               //shows approx 6 labels (e.g., 1, 6, 12, 18...
                    tickFormatter={(day) => `${day}/${currentMonthStr}`} // formats: 1 -> 1/12
                    axisLine={{ stroke: '#000', strokeWidth: 2 }} 
                    tickLine={false}
                    tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }}
                  />
                  <YAxis domain={[1, 5]} hide={true} />
                  
                  <ReferenceLine y={5} stroke="#E0E0E0" strokeDasharray="3 3" />
                  <ReferenceLine y={3} stroke="#E0E0E0" strokeDasharray="3 3" />
                  <ReferenceLine y={1} stroke="#E0E0E0" strokeDasharray="3 3" />

                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#a7a6c2ff" 
                    strokeWidth={3}
                    dot={{ r: 2, fill: "#b6b6b6ff" }}
                    activeDot={{ r: 5 }}  // hover 
                    connectNulls={true} // connects line if missing days in between
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            );
          })()}
          
          {/* y-axis  */}
          <div className="chart-legend-y">
            {[5, 4, 3, 2, 1].map(level => (
              <div key={level} className="legend-item">
                <span className="dot" style={{ backgroundColor: moodConfig[level].color }}/>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* statistic section */}
      <div className="card stats-card">
        <h3>Mood Percentage</h3>
        <div className="stats-grid">
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className="stat-item">
              <div className="stat-icon-circle" style={{ backgroundColor: moodConfig[level].color }}>
                <span className="stat-emoji">{moodConfig[level].icon}</span>
              </div>
              <span className="stat-value">{stats[level] || 0}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* intervention bubble */}
      {showIntervention && (
        <div className="intervention-wrapper">
          <div className="speech-bubble">
            <p>We've noticed you've been having a tough week. Would you like to request a <b>counseling session</b>?</p>
            <div className="bubble-actions">
              <button className="btn-yes" onClick={() => navigate("/student/counselor-support")}>Yes</button>
              <button className="btn-no" onClick={() => { localStorage.setItem(INTERVENTION_DISMISSED_KEY, "true"); setShowIntervention(false)}}>No, I'm fine ~</button>
            </div>
          </div>
          <div className="sad-avatar">
            <div className="avatar-face">😢</div>
          </div>
        </div>
      )}

      
    </div>
    </StudentLayout>
  );
};

export default MoodAnalysis;