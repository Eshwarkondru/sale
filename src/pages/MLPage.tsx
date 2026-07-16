import { useMemo, useState } from 'react';
import { BrainCircuit, Play, CheckCircle2 } from 'lucide-react';
import Card from '../components/Card';
import { SeriesChart, ScatterPlot } from '../components/Charts';
import { useData } from '../context/DataContext';
import { trainModels, predictStudent } from '../lib/ml';
import { type TrainingResult, type Student, type StudentPrediction, SUBJECT_LABELS } from '../lib/types';
import { motion } from 'framer-motion';
import Spinner, { FullPageLoader } from '../components/Spinner';

export default function MLPage() {
  const { students, loading } = useData();
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [training, setTraining] = useState(false);

  const handleTrain = () => {
    setTraining(true);
    setTimeout(() => {
      const r = trainModels(students);
      setResult(r);
      setTraining(false);
    }, 50);
  };

  if (loading) return <FullPageLoader label="Loading dataset..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Machine Learning</h1>
          <p className="text-slate-500 dark:text-slate-400">Train models to predict final marks and student performance.</p>
        </div>
        <button onClick={handleTrain} disabled={training || students.length < 10} className="btn-primary">
          {training ? <Spinner size={18} /> : <Play size={18} />}
          {training ? 'Training...' : 'Train Models'}
        </button>
      </div>

      {students.length < 10 && (
        <Card>
          <p className="text-slate-500 text-center py-6">Need at least 10 student records to train. Upload a dataset or seed sample data from the dashboard.</p>
        </Card>
      )}

      {training && <FullPageLoader label="Training Linear Regression, Decision Tree, and Random Forest..." />}

      {!training && result && <Results result={result} students={students} />}

      {!training && !result && students.length >= 10 && (
        <Card>
          <div className="text-center py-12">
            <BrainCircuit size={48} className="mx-auto text-brand-500 mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">Ready to train</p>
            <p className="text-sm text-slate-500 mt-1">Click "Train Models" to train 3 algorithms and compare their accuracy on {students.length} records.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

function Results({ result, students }: { result: TrainingResult; students: Student[] }) {
  const { models, best, features, yActual } = result;
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id ?? '');

  const confusion = useMemo(() => {
    const preds = best.predictions;
    let tp = 0, tn = 0, fp = 0, fn = 0;
    for (let i = 0; i < yActual.length; i++) {
      const actualPass = yActual[i] >= 40;
      const predPass = preds[i] >= 40;
      if (actualPass && predPass) tp++;
      else if (!actualPass && !predPass) tn++;
      else if (!actualPass && predPass) fp++;
      else fn++;
    }
    return { tp, tn, fp, fn };
  }, [best, yActual]);

  const student = students.find((s) => s.id === selectedStudent);
  const prediction: StudentPrediction | null = student ? predictStudent(student) : null;

  const featureImp: Record<string, number> = best.featureImportance ?? {};
  const sortedFeatures = Object.entries(featureImp).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {models.map((m: { name: string; r2: number; rmse: number; mae: number }) => (
          <Card key={m.name}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-800 dark:text-white">{m.name}</p>
              {m.name === best.name && <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><CheckCircle2 size={12} className="mr-1" /> Best</span>}
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <Metric label="R² Score" value={m.r2.toFixed(4)} good={m.r2 > 0.5} />
              <Metric label="RMSE" value={m.rmse.toFixed(2)} good={m.rmse < 10} />
              <Metric label="MAE" value={m.mae.toFixed(2)} good={m.mae < 8} />
            </div>
          </Card>
        ))}
      </div>

      <Card title="Model Accuracy Comparison" subtitle="R² score (higher is better) and RMSE (lower is better)">
        <SeriesChart
          labels={models.map((m: { name: string }) => m.name)}
          datasets={[
            { label: 'R² Score', data: models.map((m: { r2: number }) => Math.round(m.r2 * 1000) / 10) },
            { label: 'RMSE', data: models.map((m: { rmse: number }) => Math.round(m.rmse * 10) / 10) },
          ]}
          type="bar"
          height={300}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Feature Importance" subtitle={`From best model (${best.name})`}>
          <SeriesChart
            labels={sortedFeatures.map(([f]: [string, number]) => (SUBJECT_LABELS as Record<string, string>)[f] ?? f)}
            datasets={[{ label: 'Importance (%)', data: sortedFeatures.map(([, v]: [string, number]) => Math.round(v * 10) / 10) }]}
            type="bar"
            height={320}
          />
        </Card>

        <Card title="Predicted vs Actual" subtitle="Best model on test set">
          <ScatterPlot
            points={best.predictions.map((p: number, i: number) => ({ x: yActual[i], y: p }))}
            label="Predictions"
            xLabel="Actual Final Marks"
            yLabel="Predicted Final Marks"
            height={320}
          />
        </Card>
      </div>

      <Card title="Confusion Matrix (Pass/Fail)" subtitle="Best model predictions vs actual outcomes">
        <div className="grid grid-cols-2 max-w-sm mx-auto gap-1 text-center">
          <div className="bg-emerald-100 dark:bg-emerald-500/15 p-4 rounded-xl">
            <p className="text-xs text-emerald-700 dark:text-emerald-300">True Pass</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{confusion.tp}</p>
          </div>
          <div className="bg-rose-100 dark:bg-rose-500/15 p-4 rounded-xl">
            <p className="text-xs text-rose-700 dark:text-rose-300">False Fail</p>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{confusion.fn}</p>
          </div>
          <div className="bg-amber-100 dark:bg-amber-500/15 p-4 rounded-xl">
            <p className="text-xs text-amber-700 dark:text-amber-300">False Pass</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{confusion.fp}</p>
          </div>
          <div className="bg-emerald-100 dark:bg-emerald-500/15 p-4 rounded-xl">
            <p className="text-xs text-emerald-700 dark:text-emerald-300">True Fail</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{confusion.tn}</p>
          </div>
        </div>
        <p className="text-center text-sm text-slate-500 mt-3">
          Accuracy: {Math.round(((confusion.tp + confusion.tn) / (confusion.tp + confusion.tn + confusion.fp + confusion.fn)) * 1000) / 10}%
        </p>
      </Card>

      <Card title="Predict a Student" subtitle="Select a student to see predicted marks, GPA, grade, pass probability, backlog risk, and performance category">
        <div className="mb-4">
          <select className="input max-w-md" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
            {students.slice(0, 200).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>)}
          </select>
        </div>
        {student && prediction && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <PredictionBox label="Predicted Marks" value={String(prediction.predictedMarks)} />
            <PredictionBox label="Predicted GPA" value={String(prediction.predictedGPA)} />
            <PredictionBox label="Grade" value={prediction.grade} />
            <PredictionBox label="Pass Probability" value={`${Math.round(prediction.passProbability * 100)}%`} good={prediction.passProbability > 0.6} />
            <PredictionBox label="Backlog Risk" value={prediction.backlogRisk ? 'Yes' : 'No'} good={!prediction.backlogRisk} />
            <PredictionBox label="Category" value={prediction.category} good={prediction.category === 'Excellent' || prediction.category === 'Good'} />
            <PredictionBox label="Risk Level" value={prediction.riskLevel} good={prediction.riskLevel === 'Low Risk'} />
          </motion.div>
        )}
      </Card>

      <Card title="Trained Features" subtitle={`${features.length} features used for prediction`}>
        <div className="flex flex-wrap gap-2">
          {features.map((f: string) => (
            <span key={f} className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              {(SUBJECT_LABELS as Record<string, string>)[f] ?? f}
            </span>
          ))}
        </div>
      </Card>
    </>
  );
}

function Metric({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-semibold ${good ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>{value}</span>
    </div>
  );
}

function PredictionBox({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${good === undefined ? 'text-slate-800 dark:text-white' : good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{value}</p>
    </div>
  );
}
