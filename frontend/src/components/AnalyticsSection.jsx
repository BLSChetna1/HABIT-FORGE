import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function AnalyticsSection({ chartData, chartOptions }) {
  return (
    <div className="progress-card">
      <h2>📈 Analytics</h2>

      <Bar
        data={chartData}
        options={chartOptions}
      />
    </div>
  );
}

export default AnalyticsSection;
