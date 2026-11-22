import type { Course, Lesson } from '../types/academy.ts';

function makeLesson(
  prefix: string,
  number: number,
  moduleTitle: string,
  title: string,
  duration: string,
  summary: string,
  conceptBody: string,
  keyPoints: string[],
  archBody: string,
  language: string,
  filename: string,
  code: string,
  quiz: { q: string; opts: [string, string, string, string]; ans: number; exp: string }[]
): Lesson {
  return {
    id: `${prefix}-l${number}`,
    number,
    title,
    moduleTitle,
    duration,
    xpReward: 50,
    summary,
    notes: [
      {
        heading: 'Core Architecture & Mental Model',
        body: conceptBody,
        keyPoints,
      },
      {
        heading: 'Production Trade-Offs & Pitfalls',
        body: archBody,
      },
    ],
    codeExample: {
      language,
      filename,
      code: code.trim(),
    },
    quiz: quiz.map((item, idx) => ({
      id: `${prefix}-l${number}-q${idx + 1}`,
      question: item.q,
      options: item.opts,
      correctIndex: item.ans,
      explanation: item.exp,
    })),
  };
}

export const COURSES_DESIGN_CLOUD: Course[] = [
  {
    slug: 'data-science',
    title: 'Statistical Modeling, Python Pipelines & Applied ML',
    subtitle: 'Transform noisy tabular and time-series datasets into calibrated predictive models and crisp analytics.',
    category: 'Data Science',
    level: 'Intermediate',
    duration: '13h 40m',
    instructor: 'Dr. Priya Nair',
    instructorRole: 'Lead Data Scientist',
    coverImage: '/src/assets/images/course_ai_engineering_1795343841445.jpg',
    accentFrom: '#0ea5e9',
    accentTo: '#6366f1',
    rating: 4.8,
    studentsCount: 3920,
    outcomes: [
      'Vectorize numerical computations with NumPy broadcasting',
      'Clean, join, and aggregate messy multi-source tables cleanly',
      'Design leak-free train/validation/test cross-validation pipelines',
      'Calibrate probabilities and communicate uncertainty clearly',
    ],
    lessons: [
      makeLesson(
        'ds',
        1,
        'Numerical Foundations',
        'NumPy Vectorization & Broadcasting',
        '32 min',
        'Replace slow Python loops with contiguous C-speed vectorized array operations.',
        'Pure Python loops dispatch dynamic type checks on every element. NumPy arrays pack homogeneous numbers contiguously in memory, unlocking SIMD vector instructions.',
        [
          'Avoid nested Python for-loops over numeric arrays',
          'Use broadcasting rules to align shapes cleanly without duplicating memory',
          'Inspect array dtype (float32 vs float64) to control RAM footprint',
        ],
        'Always verify intermediate shapes when broadcasting `(N, 1)` against `(N,)`—unintended outer products `(N, N)` can exhaust RAM silently.',
        'python',
        'pipelines/vectorize.py',
        `import numpy as np

scores = np.array([72, 85, 91, 64, 88], dtype=np.float64)
z_scores = (scores - scores.mean()) / scores.std()
print(np.round(z_scores, 3))`,
        [
          {
            q: 'Why is NumPy vectorization dramatically faster than Python for-loops?',
            opts: [
              'Contiguous typed buffers run in compiled C/SIMD loops without per-element type dispatch',
              'NumPy skips math operations',
              'Python loops run on the GPU only',
              'It disables floating point numbers',
            ],
            ans: 0,
            exp: 'Homogeneous memory layout avoids Python object boxing overhead.',
          },
          {
            q: 'What bug can happen if you add a (10000, 1) array to a (10000,) array?',
            opts: [
              'Broadcasting expands it into a 10000 x 10000 matrix (~800MB)',
              'NumPy rounds to zero',
              'Python deletes the variable',
              'It converts floats to booleans',
            ],
            ans: 0,
            exp: 'Aligning 2D column vectors with 1D row vectors creates an N x N grid.',
          },
          {
            q: 'What does z-score normalization center a feature around?',
            opts: ['Mean 0 and standard deviation 1', 'Mean 100', 'Min 1 and Max 2', 'Median 50'],
            ans: 0,
            exp: 'Subtracting mean and dividing by std normalizes scale across features.',
          },
        ]
      ),
      makeLesson(
        'ds',
        2,
        'Numerical Foundations',
        'Tabular Data Wrangling & Tidy Schemas',
        '35 min',
        'Handle missing values, timezones, and relational merges cleanly without silent row multiplication.',
        'Real datasets arrive with duplicated keys, inconsistent timestamps, and missing fields. Explicit join cardinality checks prevent subtle analytical corruption.',
        [
          'Validate join keys (`validate="many_to_one"`) so unexpected duplicates raise immediately',
          'Normalize all timestamps to UTC before computing rolling windows',
          'Distinguish true zero values from missing/null measurements',
        ],
        'Chaining chained-indexing assignments creates ambiguous copies—always construct clean transformational pipelines.',
        'python',
        'pipelines/wrangle.py',
        `def clean_records(rows: list[dict]) -> list[dict]:
    cleaned = []
    for row in rows:
        xp = max(0, int(row.get("xp") or 0))
        cleaned.append({"email": row["email"].strip().lower(), "xp": xp})
    return cleaned`,
        [
          {
            q: 'Why specify join cardinality assertions when merging two tables?',
            opts: [
              'To catch unexpected duplicate keys that would silently multiply rows and inflate totals',
              'To make column names uppercase',
              'To disable sorting',
              'To convert JSON to XML',
            ],
            ans: 0,
            exp: 'Many-to-many accidental explosions are a top cause of wrong business metrics.',
          },
          {
            q: 'Why standardize timestamps to UTC during ETL?',
            opts: [
              'Daylight saving jumps and mixed local offsets break chronological joins and windowing',
              'UTC uses fewer letters',
              'Python forbids local time',
              'SQLite drops local dates',
            ],
            ans: 0,
            exp: 'UTC provides a monotonic reference timeline.',
          },
          {
            q: 'Why avoid filling missing numeric sensor readings blindly with 0?',
            opts: [
              'Zero may be a physically valid extreme that biases averages downward',
              'Zero cannot be stored in floats',
              'Databases reject zero',
              'It doubles file size',
            ],
            ans: 0,
            exp: 'Use explicit missingness flags or principled imputation.',
          },
        ]
      ),
      makeLesson(
        'ds',
        3,
        'Exploratory Analysis',
        'Distributions, Outliers & Simpson’s Paradox',
        '30 min',
        'Diagnose skewed metrics, heavy tails, and confounding segments before building models.',
        'Averages mislead on heavy-tailed metrics like latency or revenue. Inspect quantiles (P50, P90, P99) and stratify by key cohorts to avoid Simpson’s Paradox.',
        [
          'Compare median and IQR alongside mean and standard deviation',
          'Segment aggregates by cohort/plan/region to detect confounding trends',
          'Inspect log-scale histograms for power-law distributions',
        ],
        'Dropping outliers blindly removes fraud signals or high-value VIP customers—investigate extreme values before filtering.',
        'python',
        'pipelines/quantiles.py',
        `def summarize_skewed(values: list[float]) -> dict[str, float]:
    s = sorted(values)
    n = len(s)
    return {
        "p50": s[n // 2],
        "p90": s[int(0.9 * (n - 1))],
        "mean": round(sum(s) / n, 2),
    }`,
        [
          {
            q: 'What is Simpson’s Paradox?',
            opts: [
              'A trend visible in aggregated data reverses when broken down into underlying subgroups',
              'A syntax error in Python',
              'A neural network optimizer',
              'A CSS grid bug',
            ],
            ans: 0,
            exp: 'Confounding variables can flip aggregate averages when group sizes differ.',
          },
          {
            q: 'Which metric resists distortion from a single extreme outlier?',
            opts: ['Mean', 'Median (P50)', 'Sum', 'Max'],
            ans: 1,
            exp: 'Median depends on rank order rather than outlier magnitude.',
          },
          {
            q: 'Why visualize skewed data on a logarithmic axis?',
            opts: [
              'To reveal multiplicative structure across orders of magnitude',
              'To hide missing data',
              'To turn bar charts into pie charts',
              'To increase font weight',
            ],
            ans: 0,
            exp: 'Log scales compress wide heavy tails cleanly.',
          },
        ]
      ),
      makeLesson(
        'ds',
        4,
        'Exploratory Analysis',
        'Hypothesis Testing & Confidence Intervals',
        '34 min',
        'Design A/B experiments with statistical power, guard against p-hacking, and report effect sizes.',
        'Peeking at p-values every hour until an experiment turns "significant" inflates false positives dramatically. Lock sample sizes upfront and report confidence intervals.',
        [
          'Compute Minimum Detectable Effect (MDE) and required sample size before launch',
          'Report absolute + relative lift with 95% confidence intervals, not just p-values',
          'Apply multiple-testing corrections when evaluating many secondary metrics',
        ],
        'Statistically significant tiny lifts (+0.05%) may still be practically meaningless once engineering maintenance cost is considered.',
        'python',
        'pipelines/ab_check.py',
        `import math

def standard_error_prop(conversions: int, visitors: int) -> float:
    p = conversions / visitors
    return math.sqrt(p * (1 - p) / visitors)`,
        [
          {
            q: 'Why is repeated "peeking" at A/B test p-values dangerous?',
            opts: [
              'It inflates false-positive Type I error rates well above 5%',
              'It lowers database speed',
              'It increases CSS load time',
              'It deletes control group users',
            ],
            ans: 0,
            exp: 'Fixed-horizon tests assume evaluation only after the precomputed sample size.',
          },
          {
            q: 'What does a 95% confidence interval communicate beyond a p-value?',
            opts: [
              'The plausible range and precision of the true effect size',
              'The exact revenue in dollars',
              'The database row count',
              'Model training time',
            ],
            ans: 0,
            exp: 'Confidence intervals convey both practical magnitude and uncertainty.',
          },
          {
            q: 'When running 20 independent metric tests at alpha=0.05, what happens without correction?',
            opts: [
              'Roughly 1 metric will look significant purely by random chance',
              'All 20 become 100% accurate',
              'Variance drops to zero',
              'Sample size doubles',
            ],
            ans: 0,
            exp: 'Multiple comparisons require FDR/Bonferroni adjustments.',
          },
        ]
      ),
      makeLesson(
        'ds',
        5,
        'Predictive Modeling',
        'Data Leakage & Cross-Validation Design',
        '36 min',
        'Prevent over-optimistic validation scores caused by target leakage and improper train/test splits.',
        'Fitting a scaler or imputer on the full dataset before splitting leaks test distribution statistics into training. Every preprocessing transform must fit strictly inside each fold.',
        [
          'Wrap scalers, encoders, and models inside unified Pipeline objects',
          'Use time-based splits (never random shuffles) for forecasting and temporal data',
          'Use group splits when multiple rows belong to the same user or patient',
        ],
        'If validation accuracy looks suspiciously near 99.9%, inspect features immediately for post-outcome target leakage.',
        'python',
        'pipelines/time_split.py',
        `def time_ordered_split(records: list[dict], train_ratio = 0.8):
    ordered = sorted(records, key=lambda r: r["timestamp"])
    cut = int(len(ordered) * train_ratio)
    return ordered[:cut], ordered[cut:]`,
        [
          {
            q: 'Why must feature scaling fit ONLY on the training fold?',
            opts: [
              'Computing mean/std on the full dataset leaks test set statistics into training',
              'Test data cannot have means',
              'Python raises a syntax error',
              'To speed up inference',
            ],
            ans: 0,
            exp: 'Strict fold isolation ensures unbiased generalization estimates.',
          },
          {
            q: 'How should temporal churn or sales forecasting datasets be split?',
            opts: [
              'Random 80/20 shuffle',
              'Chronological past-trains-future split',
              'Alphabetical by user name',
              'Even/odd row indices',
            ],
            ans: 1,
            exp: 'Random shuffling leaks future trends backward into training.',
          },
          {
            q: 'What does GroupKFold prevent?',
            opts: [
              'Rows from the same user appearing in both train and validation folds',
              'Missing values',
              'Floating point rounding',
              'Slow SQL queries',
            ],
            ans: 0,
            exp: 'Group splits ensure the model generalizes to unseen entities.',
          },
        ]
      ),
      makeLesson(
        'ds',
        6,
        'Predictive Modeling',
        'Linear Models, Regularization & Feature Scaling',
        '34 min',
        'Build interpretable baselines using Ridge (L2) and Lasso (L1) regularization.',
        'Always build a simple, fast regularized linear baseline before reaching for deep neural nets or massive ensembles. It validates your pipeline and sets a clear benchmark.',
        [
          'Standardize feature scales before applying L1/L2 penalties so coefficients penalize fairly',
          'Use L1 (Lasso) for sparse feature selection and L2 (Ridge) for collinear features',
          'Inspect residuals across predicted ranges to spot non-linear patterns',
        ],
        'Linear models fail when target relationships are strongly non-linear unless engineered with splines, interactions, or tree models.',
        'python',
        'pipelines/ridge_step.py',
        `def l2_loss(preds: list[float], targets: list[float], weights: list[float], alpha = 0.1) -> float:
    mse = sum((p - y) ** 2 for p, y in zip(preds, targets)) / len(targets)
    penalty = alpha * sum(w * w for w in weights)
    return round(mse + penalty, 4)`,
        [
          {
            q: 'Why must features be scaled before applying Ridge or Lasso regularization?',
            opts: [
              'Unscaled large-magnitude features otherwise receive unfairly tiny coefficients and lighter penalties',
              'Gradient descent only accepts integers',
              'Unscaled strings crash numpy',
              'It removes the intercept',
            ],
            ans: 0,
            exp: 'Regularization penalizes coefficient magnitude, which depends on feature units.',
          },
          {
            q: 'Which regularization tends to shrink irrelevant weights exactly to zero?',
            opts: ['L2 (Ridge)', 'L1 (Lasso)', 'No penalty', 'Dropout'],
            ans: 1,
            exp: 'L1 geometry produces sparse solutions by zeroing weak weights.',
          },
          {
            q: 'Why start every modeling project with a simple baseline?',
            opts: [
              'To verify data pipelines end-to-end and prove complex models add real lift',
              'Because complex models are illegal',
              'To double inference cost',
              'To avoid testing',
            ],
            ans: 0,
            exp: 'Strong baselines expose pipeline bugs early and measure genuine progress.',
          },
        ]
      ),
      makeLesson(
        'ds',
        7,
        'Predictive Modeling',
        'Gradient Boosted Trees & Feature Engineering',
        '38 min',
        'Master XGBoost/LightGBM mechanics, monotonic constraints, and domain-driven feature crafting.',
        'On tabular datasets, gradient-boosted decision trees routinely outperform deep networks while handling non-linearities and missing values natively.',
        [
          'Tune learning_rate together with early stopping on validation loss',
          'Engineer domain ratios, rolling aggregates, and time-since-event features',
          'Control tree depth and min_child_weight to prevent memorizing noisy leaves',
        ],
        'One-hot encoding high-cardinality IDs creates thousands of sparse columns—prefer target encoding computed strictly out-of-fold.',
        'python',
        'pipelines/rolling_feature.py',
        `def rolling_mean(series: list[float], window: int) -> list[float]:
    return [
        round(sum(series[max(0, i - window + 1):i + 1]) / min(window, i + 1), 2)
        for i in range(len(series))
    ]`,
        [
          {
            q: 'Why do gradient boosted trees excel on structured tabular data?',
            opts: [
              'They split cleanly along axis-aligned thresholds and capture feature interactions naturally',
              'They ignore all labels',
              'They require 100 GPUs',
              'They only read images',
            ],
            ans: 0,
            exp: 'Boosted trees model heterogeneous scales and non-linear thresholds effortlessly.',
          },
          {
            q: 'How should target encoding be computed for high-cardinality categories?',
            opts: [
              'Out-of-fold using only training rows to avoid target leakage',
              'Across train + test combined',
              'Using random numbers',
              'Inside the test set only',
            ],
            ans: 0,
            exp: 'Out-of-fold encoding prevents memorizing target labels.',
          },
          {
            q: 'What prevents gradient boosted trees from overfitting training noise?',
            opts: [
              'Early stopping, shallow max_depth, and higher min_child_samples',
              'Setting depth to 100',
              'Removing validation sets',
              'Duplicating training rows',
            ],
            ans: 0,
            exp: 'Regularizing tree complexity preserves generalization.',
          },
        ]
      ),
      makeLesson(
        'ds',
        8,
        'Evaluation & Deployment',
        'Precision-Recall, ROC & Probability Calibration',
        '33 min',
        'Choose evaluation metrics aligned with class imbalance and calibrate predicted probabilities reliably.',
        'On a 1% fraud dataset, a dummy classifier predicting "not fraud" achieves 99% accuracy while catching zero fraud. Use PR-AUC, F1, and calibrated probabilities.',
        [
          'Prefer Precision-Recall AUC over ROC-AUC under severe class imbalance',
          'Apply Platt scaling or Isotonic regression when raw scores represent decision margins',
          'Select classification thresholds using real business cost matrices',
        ],
        'Verify calibration with reliability diagrams and Brier score before multiplying predicted probabilities by dollar values.',
        'python',
        'pipelines/metrics.py',
        `def precision_recall(tp: int, fp: int, fn: int) -> tuple[float, float]:
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    return round(precision, 3), round(recall, 3)`,
        [
          {
            q: 'Why is accuracy misleading on imbalanced datasets (e.g., 99% negative)?',
            opts: [
              'Predicting the majority class achieves 99% accuracy with 0% recall on positives',
              'Accuracy cannot exceed 50%',
              'Precision equals zero always',
              'Databases drop rare classes',
            ],
            ans: 0,
            exp: 'Class imbalance masks total failure on the minority class.',
          },
          {
            q: 'What does probability calibration ensure?',
            opts: [
              'Among predictions scored 0.70, roughly 70% are truly positive outcomes',
              'All probabilities equal 1.0',
              'Trees become linear',
              'Training takes 1ms',
            ],
            ans: 0,
            exp: 'Calibrated probabilities align model confidence with empirical frequency.',
          },
          {
            q: 'How should the decision threshold (e.g. 0.5 vs 0.25) be chosen?',
            opts: [
              'Based on the relative cost of false positives vs false negatives',
              'Always locked at 0.5',
              'Chosen randomly',
              'Equal to learning rate',
            ],
            ans: 0,
            exp: 'Threshold tuning optimizes real-world decision utility.',
          },
        ]
      ),
      makeLesson(
        'ds',
        9,
        'Evaluation & Deployment',
        'Explainability (SHAP) & Fairness Audits',
        '29 min',
        'Audit global and per-prediction feature attributions and monitor disparate impact across demographic cohorts.',
        'Stakeholders and regulators require transparent explanations for model decisions. Permutation importance and SHAP values quantify how each feature shifted a prediction.',
        [
          'Audit false-positive and false-negative rates separately across key subgroups',
          'Avoid proxy features that correlate strongly with protected attributes',
          'Surface top human-readable reason codes alongside high-stakes decisions',
        ],
        'Feature importance explains what the model relied on—not causal proof that changing that feature in the real world alters outcomes.',
        'python',
        'pipelines/disparity.py',
        `def group_fpr(fp: int, tn: int) -> float:
    return round(fp / (fp + tn), 4) if (fp + tn) else 0.0`,
        [
          {
            q: 'What is the difference between predictive feature importance and causality?',
            opts: [
              'Correlation/attribution explains model reliance, not real-world causal intervention effects',
              'They are identical',
              'Causal models never use data',
              'SHAP proves physics laws',
            ],
            ans: 0,
            exp: 'Correlated proxies can carry high attribution without causal effect.',
          },
          {
            q: 'Why audit error rates separately by subgroup?',
            opts: [
              'Aggregate metrics can hide disproportionately high error rates in smaller groups',
              'To inflate accuracy',
              'To delete features',
              'To bypass testing',
            ],
            ans: 0,
            exp: 'Disaggregated evaluation reveals hidden fairness gaps.',
          },
          {
            q: 'What is a proxy variable?',
            opts: [
              'An allowed feature (e.g., ZIP code) highly correlated with a protected attribute',
              'An HTTP gateway',
              'A SQLite index',
              'A Python decorator',
            ],
            ans: 0,
            exp: 'Dropping a protected column alone does not prevent proxy bias.',
          },
        ]
      ),
      makeLesson(
        'ds',
        10,
        'Evaluation & Deployment',
        'Model Serving, Feature Drift & Monitoring',
        '31 min',
        'Detect covariate drift, pipeline breaks, and silent accuracy decay in production ML systems.',
        'Models degrade quietly as user behavior shifts, upstream schemas change, or real-world macro conditions evolve.',
        [
          'Monitor input feature null rates and distribution shifts (PSI / KS tests)',
          'Version training code, feature definitions, and model artifacts together',
          'Automate shadow deployments before cutting live traffic to new model versions',
        ],
        'Training-serving skew occurs when offline Python feature pipelines differ slightly from live API feature logic—share a single feature transform library.',
        'python',
        'pipelines/psi.py',
        `import math

def psi_bucket(expected_pct: float, actual_pct: float) -> float:
    e = max(expected_pct, 1e-6)
    a = max(actual_pct, 1e-6)
    return (a - e) * math.log(a / e)`,
        [
          {
            q: 'What causes training-serving skew?',
            opts: [
              'Divergent feature computation logic between offline notebooks and live production services',
              'Using dark mode in VS Code',
              'High-resolution monitors',
              'Too many SQLite rows',
            ],
            ans: 0,
            exp: 'Sharing unified feature transformation modules eliminates skew.',
          },
          {
            q: 'Why monitor input feature null rates in production?',
            opts: [
              'Broken upstream tracking events cause silent garbage predictions without throwing 500s',
              'Nulls make models faster',
              'To compress logs',
              'To skip retraining',
            ],
            ans: 0,
            exp: 'Data quality alerts catch silent upstream breaks immediately.',
          },
          {
            q: 'What is a shadow deployment?',
            opts: [
              'Scoring live traffic with a new model silently in parallel without affecting user responses yet',
              'Deploying without tests',
              'Running on localhost only',
              'Deleting production logs',
            ],
            ans: 0,
            exp: 'Shadowing validates latency and score distributions safely on real traffic.',
          },
        ]
      ),
    ],
  },
  {
    slug: 'ui-ux-design',
    title: 'Design Systems, Typography & Interactive Prototyping',
    subtitle: 'Craft high-contrast interfaces, mathematical type scales, accessible tokens, and tactile motion systems.',
    category: 'UI/UX Design',
    level: 'Beginner',
    duration: '11h 50m',
    instructor: 'Sora Takahashi',
    instructorRole: 'Design Systems Lead',
    coverImage: '/src/assets/images/hero_academy_workspace_1795343842326.jpg',
    accentFrom: '#8b5cf6',
    accentTo: '#06b6d4',
    rating: 4.9,
    studentsCount: 4180,
    outcomes: [
      'Establish disciplined 60-30-10 color tokens and WCAG AA contrast ratios',
      'Build fluid modular typography scales and 8px spatial grids',
      'Design zero-clutter navigation, tables, and accessible forms',
      'Translate interactive prototypes into reusable Tailwind token systems',
    ],
    lessons: [
      makeLesson(
        'uiux',
        1,
        'Visual Hierarchy & Systems',
        'Visual Hierarchy, Focal Anchors & Scannability',
        '27 min',
        'Direct user attention effortlessly using scale, contrast, alignment, and deliberate whitespace.',
        'When every card, badge, and button shouts at maximum contrast, nothing stands out. Strong hierarchy assigns exactly one focal anchor per screen.',
        [
          'Establish 3 clear typographic levels: Display Anchor, Section Subhead, Body/Metadata',
          'Use whitespace and subtle hairline dividers instead of heavy nested borders',
          'Align related elements on strict vertical grid lines so eyes scan rapidly',
        ],
        'Resist decorating metadata with bright pill boxes—quiet unboxed inline text keeps visual focus on primary titles and actions.',
        'css',
        'tokens/hierarchy.css',
        `:root {
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --surface-hairline: rgba(148, 163, 184, 0.14);
}`,
        [
          {
            q: 'What happens when multiple rival elements on a screen use equally bright primary styling?',
            opts: [
              'Visual hierarchy collapses and users hesitate on what to do next',
              'Conversion doubles automatically',
              'Load time speeds up',
              'Contrast passes automatically',
            ],
            ans: 0,
            exp: 'Every viewport frame needs one clear primary focal anchor.',
          },
          {
            q: 'How should nested cards be avoided while still grouping content?',
            opts: [
              'Use whitespace margins and subtle 1px hairline dividers',
              'Add 4px drop shadows on every paragraph',
              'Hide all text',
              'Use flashing borders',
            ],
            ans: 0,
            exp: 'Whitespace and hairlines create calm structure without visual noise.',
          },
          {
            q: 'Why align tabular figures and labels vertically?',
            opts: [
              'Alignment minimizes eye movement and builds instant perceived polish',
              'CSS forbids unaligned text',
              'It disables scrolling',
              'It reduces font size',
            ],
            ans: 0,
            exp: 'Crisp alignment conveys craftsmanship and boosts scan speed.',
          },
        ]
      ),
      makeLesson(
        'uiux',
        2,
        'Visual Hierarchy & Systems',
        'Typography Pairings, Measure & Optical Balance',
        '29 min',
        'Pair expressive display faces with readable body fonts, tune line-height, and enforce comfortable reading widths.',
        'Readability depends heavily on measure (line length) and optical weight. Lines wider than 80 characters fatigue readers, while dark-mode light text needs slightly generous tracking.',
        [
          'Keep prose line lengths between 60ch and 75ch',
          'Apply `text-wrap: balance` on headlines to prevent orphan trailing words',
          'Enforce `font-variant-numeric: tabular-nums` on dashboards, prices, and timers',
        ],
        'Stick to at most two font families (Display + Body) plus one monospace face strictly for code and numeric tables.',
        'css',
        'tokens/typography.css',
        `.prose-measure {
  max-width: 68ch;
  line-height: 1.65;
}

.hero-headline {
  font-family: "Plus Jakarta Sans", sans-serif;
  text-wrap: balance;
  letter-spacing: -0.025em;
}`,
        [
          {
            q: 'What is the ideal reading line length (measure) for body prose?',
            opts: ['20–30 characters', '60–75 characters', '130–160 characters', '200+ characters'],
            ans: 1,
            exp: '60–75ch prevents eye fatigue when jumping from line end to next line start.',
          },
          {
            q: 'What does `text-wrap: balance` fix on display headlines?',
            opts: [
              'Prevents awkward single-word orphan lines at the end of wrapped titles',
              'Changes font color',
              'Converts sans-serif to serif',
              'Centers body paragraphs',
            ],
            ans: 0,
            exp: 'Balanced wrapping distributes words evenly across lines.',
          },
          {
            q: 'Why enforce `tabular-nums` on KPI counters and tables?',
            opts: [
              'Every digit takes equal horizontal width so numbers align cleanly and do not jitter',
              'It makes digits italicized',
              'It rounds numbers',
              'It hides decimals',
            ],
            ans: 0,
            exp: 'Tabular figures align columns vertically and prevent layout shift during updates.',
          },
        ]
      ),
      makeLesson(
        'uiux',
        3,
        'Visual Hierarchy & Systems',
        '60-30-10 Color Discipline & Dark Mode Craft',
        '31 min',
        'Build rich dark-mode surfaces using subtle luminance steps, WCAG contrast checks, and restrained accent colors.',
        'Great dark UIs are never flat `#000` boxes with harsh neon borders. They layer deep obsidian canvases (`#05070B`), cool slate translucent panels, and disciplined accent highlights.',
        [
          'Allocate 60% dominant neutral canvas, 30% structural surfaces, 10% primary accent',
          'Ensure body text meets >= 4.5:1 contrast against dark glass backgrounds',
          'Pair semantic colors (green/amber/red) with clear text labels or icons',
        ],
        'Keep container-to-background brightness delta modest (<= 12% in dark mode) and rely on subtle 1px translucent borders for crisp separation.',
        'css',
        'tokens/colors.css',
        `:root {
  --bg-canvas: #05070b;
  --bg-surface: rgba(15, 23, 42, 0.56);
  --border-subtle: rgba(148, 163, 184, 0.14);
  --accent-primary: #3b82f6;
}`,
        [
          {
            q: 'What is the WCAG AA minimum contrast ratio for normal body text?',
            opts: ['1.5:1', '3.0:1', '4.5:1', '12.0:1'],
            ans: 2,
            exp: '4.5:1 ensures legibility for users with moderate visual impairments.',
          },
          {
            q: 'Why never convey critical error or success state by color alone?',
            opts: [
              'Color-blind users cannot distinguish red vs green hues without explicit labels or icons',
              'CSS ignores red colors',
              'Dark mode hides green',
              'It slows rendering',
            ],
            ans: 0,
            exp: 'Dual coding (color + text/icon) makes state universally clear.',
          },
          {
            q: 'How does the 60-30-10 rule keep UIs looking premium?',
            opts: [
              'Reserving vibrant accent gradients for the 10% focal interactions keeps them impactful',
              'Making 90% of the page bright neon',
              'Using 12 unrelated brand colors',
              'Removing all borders',
            ],
            ans: 0,
            exp: 'Restraint makes primary calls to action unmistakable.',
          },
        ]
      ),
      makeLesson(
        'uiux',
        4,
        'Spatial Layout & Components',
        '8px Spatial Grids & Nested Radius Math',
        '25 min',
        'Create harmonious spacing rhythm and concentric rounded corners across cards, modals, and buttons.',
        'Mismatched corner radii look subtly off. When a rounded inner box sits inside a padded outer container, subtracting the padding from the outer radius creates optical concentricity.',
        [
          'Base spacing on multiples of 4px / 8px (8, 16, 24, 32, 48, 64)',
          'Keep outer container padding >= inner gap between child items',
          'Apply concentric radius math: r_inner = max(0, r_outer - padding)',
        ],
        'Maintain horizontal button padding at roughly 2x vertical padding (`py-2.5 px-5`) so pill and rounded buttons look optically balanced.',
        'css',
        'tokens/spacing.css',
        `.outer-card {
  border-radius: 20px;
  padding: 12px;
}

.inner-media {
  border-radius: 8px; /* 20px - 12px = 8px */
}`,
        [
          {
            q: 'If an outer card has `rounded-[20px]` and `p-3` (12px), what inner radius looks optically concentric?',
            opts: ['20px', '32px', '8px', '48px'],
            ans: 2,
            exp: 'r_inner = r_outer - padding = 20 - 12 = 8px.',
          },
          {
            q: 'Why should container outer padding be >= the gap between inner children?',
            opts: [
              'Proximity principle: items inside a group feel closer to each other than to the outer edge',
              'CSS breaks if padding is large',
              'To force horizontal scrolling',
              'To hide text',
            ],
            ans: 0,
            exp: 'Gestalt grouping relies on tighter internal spacing than external framing.',
          },
          {
            q: 'What is a reliable padding ratio for primary UI buttons?',
            opts: [
              'Horizontal padding roughly 2x vertical padding',
              'Vertical 4x horizontal',
              'Zero horizontal padding',
              '1px all around',
            ],
            ans: 0,
            exp: 'Rectangular buttons feel balanced when horizontal breathing room doubles vertical padding.',
          },
        ]
      ),
      makeLesson(
        'uiux',
        5,
        'Spatial Layout & Components',
        'Navigation Patterns & Responsive Grids',
        '28 min',
        'Structure single-row top bars, responsive multi-column grids, and mobile drawers without overflow.',
        'Cluttered multi-row headers steal vertical viewport space and split user attention. Clean 3-zone top bars place brand, concise links, and primary action on one crisp line.',
        [
          'Prevent nav link wrapping with `whitespace-nowrap shrink-0`',
          'Collapse secondary nav cleanly into an accessible mobile drawer below md breakpoints',
          'Pair equal-height grid cards using CSS Grid `items-stretch`',
        ],
        'Keep sticky mobile chrome compact (<= 15% of viewport height) so content remains front and center on small phones.',
        'tsx',
        'components/HeaderPattern.tsx',
        `export function TopNavExample() {
  return (
    <header className="flex items-center justify-between gap-8 px-6 h-16 border-b border-white/10">
      <a href="/" className="font-bold whitespace-nowrap shrink-0">LearnTech Academy</a>
      <nav className="hidden md:flex items-center gap-6 text-sm">
        <a href="/courses" className="whitespace-nowrap shrink-0">Courses</a>
        <a href="/practice" className="whitespace-nowrap shrink-0">Practice</a>
      </nav>
      <a href="/signin" className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0">Sign In</a>
    </header>
  );
}`,
        [
          {
            q: 'Why apply `whitespace-nowrap shrink-0` to top navigation items?',
            opts: [
              'Prevents awkward two-line button and link wrapping on mid-sized viewports',
              'Hides links on desktop',
              'Disables hover styles',
              'Removes underline animations',
            ],
            ans: 0,
            exp: 'Single-line navigation keeps header height predictable.',
          },
          {
            q: 'What is the maximum recommended mobile viewport share for sticky bars?',
            opts: ['50%', '15%', '75%', '90%'],
            ans: 1,
            exp: 'Keeping sticky chrome under 15% preserves comfortable reading area.',
          },
          {
            q: 'Why structure a top bar into 3 balanced zones?',
            opts: [
              'Clear visual anchor: Brand left, Navigation center, Action right',
              'HTML forbids 4 divs',
              'It disables mobile menus',
              'It doubles server speed',
            ],
            ans: 0,
            exp: 'Three-zone alignment matches established mental models.',
          },
        ]
      ),
      makeLesson(
        'uiux',
        6,
        'Spatial Layout & Components',
        'Forms, Validation States & Inline Feedback',
        '30 min',
        'Design frictionless sign-in, search, and filter controls with immediate accessible feedback.',
        'Relying on placeholder text alone causes users to forget what a field expects the moment they start typing. Always render persistent visible `<label>` elements.',
        [
          'Pair every input with a programmatic `<label htmlFor="...">`',
          'Display clear inline validation errors below the specific field, never via alert()',
          'Preserve user-entered values if server submission fails',
        ],
        'Disable submit buttons while requests are in flight and display clear loading states to prevent accidental double submissions.',
        'tsx',
        'components/FieldPattern.tsx',
        `export function InputField({ id, label, error }: { id: string; label: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-200">{label}</label>
      <input id={id} className="w-full rounded-xl bg-slate-900/70 border border-white/10 px-4 py-2.5 text-sm" />
      {error && <p className="text-xs text-rose-400" role="alert">{error}</p>}
    </div>
  );
}`,
        [
          {
            q: 'Why are placeholder-only inputs an accessibility anti-pattern?',
            opts: [
              'Labels vanish as soon as typing begins and often fail contrast ratios',
              'HTML5 forbids placeholders',
              'Screen readers only read CSS',
              'Placeholders break form POSTs',
            ],
            ans: 0,
            exp: 'Persistent labels keep context clear for everyone, including assistive tech.',
          },
          {
            q: 'What ARIA role announces inline form errors immediately to screen readers?',
            opts: ['role="presentation"', 'role="alert"', 'role="banner"', 'role="tooltip"'],
            ans: 1,
            exp: 'role="alert" notifies screen readers politely/assertively when error text mounts.',
          },
          {
            q: 'Why show a loading state on submit buttons during async requests?',
            opts: [
              'Prevents duplicate clicks and reassures the user the action registered',
              'Slows down the API',
              'Clears user inputs',
              'Hides errors',
            ],
            ans: 0,
            exp: 'Immediate tactile feedback eliminates double-submit bugs.',
          },
        ]
      ),
      makeLesson(
        'uiux',
        7,
        'Accessibility & Interaction',
        'Keyboard Navigation, Focus Rings & ARIA',
        '29 min',
        'Make every accordion, modal, tab bar, and code workspace operable effortlessly via keyboard.',
        'Power users and assistive technology users navigate strictly via Tab, Enter, Space, and Arrow keys. Removing `:focus` outlines without a `:focus-visible` replacement breaks usability.',
        [
          'Use semantic `<button>` and `<a>` elements instead of clickable `<div>`s',
          'Style crisp `focus-visible:ring-2` indicators without showing rings on mouse clicks',
          'Trap focus cleanly inside open modals and restore focus on Escape close',
        ],
        'Accordions should toggle `aria-expanded` and link triggers to panel regions with `aria-controls`.',
        'tsx',
        'components/AccessibleButton.tsx',
        `export function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    >
      {label}
    </button>
  );
}`,
        [
          {
            q: 'Why prefer `:focus-visible` over `:focus` for focus outlines?',
            opts: [
              'Shows clear rings for keyboard navigation while keeping mouse clicks visually clean',
              'Disables keyboard Tab navigation',
              'Hides buttons on mobile',
              'Only works in Safari',
            ],
            ans: 0,
            exp: 'focus-visible matches keyboard/assistive modality cleanly.',
          },
          {
            q: 'Why avoid `<div onClick={...}>` for interactive triggers?',
            opts: [
              'Divs lack built-in Tab focusability, Enter/Space key activation, and button semantics',
              'Divs cannot have padding',
              'React forbids onClick on divs',
              'Divs disable Tailwind classes',
            ],
            ans: 0,
            exp: 'Native `<button>` elements provide complete keyboard & screen-reader behavior free.',
          },
          {
            q: 'What should pressing the Escape key do when a drawer or modal is open?',
            opts: ['Close the overlay and return focus to the trigger', 'Reload the page', 'Submit the form', 'Sign out'],
            ans: 0,
            exp: 'Predictable Escape dismissal is standard accessible modal behavior.',
          },
        ]
      ),
      makeLesson(
        'uiux',
        8,
        'Accessibility & Interaction',
        'Micro-Interactions & Motion Budgets',
        '26 min',
        'Use purposeful motion under 200ms to orient transitions without slowing down workflows.',
        'Animation should clarify spatial relationships and confirm actions—not force users to wait through 800ms decorative fade-ins before reading content.',
        [
          'Keep routine UI state transitions snappy (120–200ms)',
          'Use natural deceleration curves (`cubic-bezier(0.16, 1, 0.3, 1)`)',
          'Render critical above-the-fold text immediately without hiding behind scroll triggers',
        ],
        'Animating layout geometry like `width` or `margin` forces expensive browser reflows; animate `transform` and `opacity` instead.',
        'css',
        'tokens/motion.css',
        `.interactive-card {
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease;
}

.interactive-card:hover {
  transform: translateY(-2px);
}`,
        [
          {
            q: 'What is the ideal duration range for routine UI hover and toggle transitions?',
            opts: ['100–200 ms', '700–1200 ms', '2000 ms', '0 ms always'],
            ans: 0,
            exp: 'Under 200ms feels crisp and responsive without feeling sluggish.',
          },
          {
            q: 'Why should critical hero text never wait on scroll-reveal triggers at opacity: 0?',
            opts: [
              'Delayed visibility hurts perceived load speed and blocks immediate reading',
              'CSS forbids opacity 0',
              'Browsers ignore headings',
              'Fonts fail to load',
            ],
            ans: 0,
            exp: 'Above-the-fold content should be instantaneously legible on paint.',
          },
          {
            q: 'Which properties animate strictly on the GPU compositor?',
            opts: ['transform and opacity', 'height and padding', 'top and left', 'font-size'],
            ans: 0,
            exp: 'Compositor animations stay locked at 60–120fps.',
          },
        ]
      ),
      makeLesson(
        'uiux',
        9,
        'Data Visualization & Tables',
        'Designing Dense Data Tables & Empty States',
        '31 min',
        'Build scannable admin tables, aligned metrics, and helpful loading/empty/error states.',
        'Tables fail when columns wrap chaotically, numeric values fail to align, or empty search queries show a blank white/black void.',
        [
          'Left-align text columns and right-align numeric metric columns with `tabular-nums`',
          'Keep row heights compact (40–48px) with subtle row hover tinting',
          'Design explicit Empty, Loading Skeleton, and Error Retry states for every data view',
        ],
        'Avoid cramming colored status dots next to every single row—reserve visual emphasis strictly for actionable anomalies.',
        'tsx',
        'components/TableHeader.tsx',
        `export function MetricCell({ value }: { value: number }) {
  return <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200">{value.toLocaleString()}</td>;
}`,
        [
          {
            q: 'How should numeric columns in data tables be aligned?',
            opts: ['Centered', 'Right-aligned with tabular-nums', 'Justified', 'Rotated 45 degrees'],
            ans: 1,
            exp: 'Right alignment + tabular numerals aligns units, tens, and hundreds vertically.',
          },
          {
            q: 'What 4 states should every asynchronous data table handle?',
            opts: [
              'Populated, Loading Skeleton, Empty State, and Error Retry',
              'Only Populated',
              'Only Error',
              'Dark and Darker',
            ],
            ans: 0,
            exp: 'Complete state coverage prevents broken or confusing blank views.',
          },
          {
            q: 'Why keep table row heights compact (~44px)?',
            opts: [
              'Allows scanning more comparisons without excessive vertical scrolling',
              'Hides cell text',
              'Disables horizontal overflow',
              'Reduces database rows',
            ],
            ans: 0,
            exp: 'Balanced density maximizes data comparison efficiency.',
          },
        ]
      ),
      makeLesson(
        'uiux',
        10,
        'Data Visualization & Tables',
        'Design Tokens & Engineering Handoff',
        '28 min',
        'Bridge Figma design decisions and production CSS/Tailwind code using semantic design tokens.',
        'Hardcoding hex codes like `#3b82f6` in 200 places makes rebranding or theming painful. Semantic tokens (`--accent-primary`, `--surface-elevated`) express intent cleanly.',
        [
          'Separate primitive palette tokens from semantic usage tokens',
          'Document component variants, interactive states, and responsive rules together',
          'Verify built browser output against typography, spacing, and contrast specs',
        ],
        'Tailwind v4 `@theme` blocks expose custom design tokens directly as native CSS custom properties and utility classes simultaneously.',
        'css',
        'tokens/theme.css',
        `@theme {
  --font-display: "Plus Jakarta Sans", sans-serif;
  --font-sans: "DM Sans", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}`,
        [
          {
            q: 'Why prefer semantic tokens (e.g. `--surface-card`) over raw color names (`--slate-900`) in components?',
            opts: [
              'Semantic tokens communicate intent and allow theme updates without touching component markup',
              'Browsers do not support hex colors',
              'Raw colors fail CORS',
              'It disables Tailwind',
            ],
            ans: 0,
            exp: 'Semantic indirection keeps design systems maintainable at scale.',
          },
          {
            q: 'What should a complete component spec cover for engineering handoff?',
            opts: [
              'Default, hover, focus-visible, active, disabled, loading, and mobile behaviors',
              'Only the desktop resting screenshot',
              'Only the font family name',
              'Only border radius',
            ],
            ans: 0,
            exp: 'Specifying every interactive state eliminates guesswork during implementation.',
          },
          {
            q: 'How does Tailwind v4 `@theme` simplify design tokens?',
            opts: [
              'It registers CSS custom properties and generates matching utility classes automatically',
              'It compiles SQL',
              'It removes HTML tags',
              'It requires Python',
            ],
            ans: 0,
            exp: 'Tailwind v4 natively unifies CSS variables with utility generation.',
          },
        ]
      ),
    ],
  },
  {
    slug: 'cloud-engineering',
    title: 'Kubernetes, Terraform & Multi-Region Infrastructure',
    subtitle: 'Master Linux containers, Kubernetes orchestration, Terraform IaC, CI/CD, and zero-downtime cloud systems.',
    category: 'Cloud Engineering',
    level: 'Advanced',
    duration: '15h 20m',
    instructor: 'Liam O’Connor',
    instructorRole: 'Principal Cloud Architect',
    coverImage: '/src/assets/images/course_cloud_systems_1795343841022.jpg',
    accentFrom: '#2563eb',
    accentTo: '#38bdf8',
    rating: 4.9,
    studentsCount: 4760,
    outcomes: [
      'Build minimal, rootless multi-stage Docker container images',
      'Orchestrate deployments, HPA autoscaling, and readiness probes in Kubernetes',
      'Manage cloud resources declaratively with Terraform state locking',
      'Architect multi-region load balancing and zero-downtime blue/green rollouts',
    ],
    lessons: [
      makeLesson(
        'cloud',
        1,
        'Containers & Images',
        'Linux Namespaces, Cgroups & Container Internals',
        '32 min',
        'Demystify containers as isolated Linux processes governed by namespaces and resource cgroups.',
        'Unlike full Virtual Machines running guest kernels, containers share the host Linux kernel while isolating PID, network, and mount trees via namespaces.',
        [
          'Namespaces isolate what a process can see; cgroups limit CPU and RAM usage',
          'Container layers are copy-on-write—write ephemeral state to tmpfs or volumes',
          'Never run production app processes as UID 0 (root) inside containers',
        ],
        'Missing memory cgroup limits let one leaking worker trigger host-wide OOM kills affecting neighboring services.',
        'dockerfile',
        'docker/nonroot.Dockerfile',
        `FROM node:22-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
CMD ["node", "server.js"]`,
        [
          {
            q: 'Which Linux kernel feature limits how much CPU and RAM a container may consume?',
            opts: ['Control Groups (cgroups)', 'DNS', 'CSS Grid', 'iptables'],
            ans: 0,
            exp: 'cgroups enforce hardware resource quotas; namespaces isolate visibility.',
          },
          {
            q: 'Why run containers with a non-root USER instruction?',
            opts: [
              'Reduces blast radius if a container runtime escape or file vulnerability occurs',
              'Doubles image size',
              'Disables TCP sockets',
              'Required by TypeScript',
            ],
            ans: 0,
            exp: 'Least privilege inside containers is a baseline defense-in-depth practice.',
          },
          {
            q: 'How do containers differ from traditional Virtual Machines?',
            opts: [
              'Containers share the host OS kernel rather than booting a separate guest OS',
              'Containers cannot run Node.js',
              'VMs have zero isolation',
              'Containers require hardware floppy disks',
            ],
            ans: 0,
            exp: 'Kernel sharing makes container startup milliseconds-fast with minimal overhead.',
          },
        ]
      ),
      makeLesson(
        'cloud',
        2,
        'Containers & Images',
        'Multi-Stage Docker Builds & Layer Caching',
        '30 min',
        'Shrink container images from 1.2GB down to ~90MB while keeping build secrets out of final layers.',
        'Leaving compilers, devDependencies, and `.git` directories inside production images slows autoscaling pulls and enlarges your CVE surface.',
        [
          'Order Dockerfile instructions from least-frequently changed (package.json) to most-changed (src/)',
          'Copy only compiled artifacts and runtime dependencies into the final slim stage',
          'Use `.dockerignore` to exclude `node_modules`, `.env`, and local DB files',
        ],
        'Remember: deleting a file in a later `RUN rm` layer does NOT remove it from earlier image history layers—use multi-stage builds!',
        'dockerfile',
        'Dockerfile',
        `FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
USER node
CMD ["node", "server.ts"]`,
        [
          {
            q: 'Why does `RUN rm .env` in a later Dockerfile step fail to hide a secret copied earlier?',
            opts: [
              'Docker image layers are immutable; earlier layers still retain the deleted file',
              'rm does not exist on Linux',
              'Docker encrypts layers automatically',
              'Only Windows caches layers',
            ],
            ans: 0,
            exp: 'Multi-stage builds or BuildKit secret mounts keep secrets completely out of final image layers.',
          },
          {
            q: 'Why copy package.json and run `npm ci` BEFORE copying `src/`?',
            opts: [
              'Docker reuses the cached dependency layer whenever only application source files change',
              'npm forbids copying src first',
              'It runs TypeScript faster',
              'It disables HTTPS',
            ],
            ans: 0,
            exp: 'Layer cache ordering cuts CI build times dramatically.',
          },
          {
            q: 'What does `.dockerignore` prevent?',
            opts: [
              'Sending huge local node_modules or secret .env files into the Docker build context',
              'Running containers on port 3000',
              'Using Alpine Linux',
              'Pulling base images',
            ],
            ans: 0,
            exp: 'Excluding local junk speeds builds and prevents accidental secret bundling.',
          },
        ]
      ),
      makeLesson(
        'cloud',
        3,
        'Kubernetes Orchestration',
        'Pods, Deployments & Declarative Reconciliation',
        '36 min',
        'Understand Kubernetes control loops that continuously reconcile desired replica state against cluster reality.',
        'Kubernetes is declarative: you describe desired state (3 replicas of image v2.4), and controllers watch etcd to reschedule or replace failed pods automatically.',
        [
          'Never deploy bare Pods directly; manage them via Deployments and ReplicaSets',
          'Pin explicit image digests or immutable tags rather than `:latest`',
          'Set both CPU/RAM `requests` (scheduling) and `limits` (bounds)',
        ],
        'Setting no resource requests lets pods crowd onto a single node and starve during traffic spikes.',
        'yaml',
        'k8s/deployment.yaml',
        `apiVersion: apps/v1
kind: Deployment
metadata:
  name: learntech-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: learntech
  template:
    metadata:
      labels:
        app: learntech
    spec:
      containers:
        - name: web
          image: ghcr.io/learntech/web:1.4.2
          ports:
            - containerPort: 3000`,
        [
          {
            q: 'Why avoid tagging production Kubernetes images with `:latest`?',
            opts: [
              'It is mutable, making rollbacks unreliable and causing nodes to run mismatched versions',
              'Kubernetes forbids strings',
              ':latest uses 10x more RAM',
              'YAML cannot parse colons',
            ],
            ans: 0,
            exp: 'Immutable version tags or SHA256 digests guarantee deterministic deploys.',
          },
          {
            q: 'What is the difference between `requests` and `limits` in Kubernetes?',
            opts: [
              'Requests reserve guaranteed resources for scheduling; limits cap maximum burst usage',
              'They are identical',
              'Limits schedule pods; requests delete them',
              'Requests control HTTP timeouts',
            ],
            ans: 0,
            exp: 'Accurate requests help the kube-scheduler pack nodes safely.',
          },
          {
            q: 'Why wrap containers in a Deployment instead of creating bare Pods?',
            opts: [
              'Deployments enable rolling updates, rollbacks, and automatic replacement on node loss',
              'Pods cannot expose ports',
              'Deployments skip DNS',
              'Pods cannot use YAML',
            ],
            ans: 0,
            exp: 'Controllers provide self-healing and zero-downtime rollouts.',
          },
        ]
      ),
      makeLesson(
        'cloud',
        4,
        'Kubernetes Orchestration',
        'Readiness, Liveness & Rolling Zero-Downtime Probes',
        '33 min',
        'Prevent 502 errors during deployments by distinguishing readiness from liveness health probes.',
        'A readiness probe tells Kubernetes when a pod is ready to receive Service traffic; a liveness probe restarts deadlocked containers.',
        [
          'Verify database/cache readiness inside `/readyz`, keep `/healthz` lightweight',
          'Configure `maxUnavailable: 0` and `maxSurge: 1` for zero capacity dip during rollouts',
          'Pair readiness failures with graceful SIGTERM shutdown delays (`preStop`)',
        ],
        'Putting a downstream database check inside a LIVENESS probe causes a catastrophic cascade: one brief DB blip restarts every single pod in your fleet simultaneously!',
        'yaml',
        'k8s/probes.yaml',
        `readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
livenessProbe:
  httpGet:
    path: /api/live
    port: 3000
  periodSeconds: 20`,
        [
          {
            q: 'Why should a liveness probe NOT fail when an external database temporarily blips?',
            opts: [
              'Killing and restarting every web pod turns a minor DB blip into a prolonged fleet outage',
              'Liveness probes cannot make HTTP calls',
              'Databases only run on port 80',
              'YAML forbids two probes',
            ],
            ans: 0,
            exp: 'Use readiness probes to pause traffic routing; reserve liveness for unrecoverable process deadlocks.',
          },
          {
            q: 'What happens if readinessProbe fails on 1 of 3 pods?',
            opts: [
              'Kubernetes removes only that pod’s IP from Service endpoints until it recovers',
              'The entire cluster shuts down',
              'The pod deletes its Docker image',
              'DNS deletes the domain',
            ],
            ans: 0,
            exp: 'Readiness gates stop traffic from reaching unready instances.',
          },
          {
            q: 'What rollout strategy avoids dropping capacity below 100% during an upgrade?',
            opts: ['maxUnavailable: 0, maxSurge: 1', 'Recreate', 'Kill all pods first', 'Manual SSH'],
            ans: 0,
            exp: 'Surging a healthy new pod before terminating an old one preserves capacity.',
          },
        ]
      ),
      makeLesson(
        'cloud',
        5,
        'Kubernetes Orchestration',
        'Services, Ingress TLS & Autoscaling (HPA)',
        '34 min',
        'Route external HTTPS traffic cleanly and scale replica counts automatically on CPU or custom request metrics.',
        'Pod IPs are ephemeral. Services assign stable virtual cluster IPs and DNS names, while Ingress / Gateway APIs terminate TLS at the edge.',
        [
          'Terminate TLS cleanly at the edge Load Balancer / Ingress controller',
          'Configure HorizontalPodAutoscaler (HPA) with sensible min/max replica bounds',
          'Add stabilization windows so autoscalers do not thrash up and down every 15 seconds',
        ],
        'Set PodDisruptionBudgets (`minAvailable`) so voluntary cluster node upgrades never evict all replicas simultaneously.',
        'yaml',
        'k8s/hpa.yaml',
        `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: learntech-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: learntech-web
  minReplicas: 2
  maxReplicas: 12`,
        [
          {
            q: 'Why not hardcode Pod IP addresses in microservice configs?',
            opts: [
              'Pod IPs change every time a pod restarts or reschedules',
              'IPs are longer than 1000 chars',
              'Kubernetes uses IPv2',
              'DNS is slower than redeploying',
            ],
            ans: 0,
            exp: 'Services provide stable DNS names and load balancing across ephemeral pods.',
          },
          {
            q: 'What does a PodDisruptionBudget (PDB) protect against?',
            opts: [
              'Voluntary node maintenance evicting too many replicas at once',
              'SQL injection',
              'Memory leaks in React',
              'SSL expiration',
            ],
            ans: 0,
            exp: 'PDBs preserve minimum availability during cluster drains and upgrades.',
          },
          {
            q: 'Why configure HPA scale-down stabilization windows?',
            opts: [
              'To avoid flapping replicas rapidly during spiky traffic',
              'To disable scaling',
              'To save logs',
              'To pause billing',
            ],
            ans: 0,
            exp: 'Stabilization prevents premature scale-in right before another wave hits.',
          },
        ]
      ),
      makeLesson(
        'cloud',
        6,
        'Infrastructure as Code',
        'Terraform Declarative State & Modules',
        '37 min',
        'Provision VPCs, databases, and IAM roles reproducibly using Terraform HCL and remote state locking.',
        'Clicking around cloud consoles creates undocumented "snowflake" infrastructure. Infrastructure as Code (IaC) stores topology in Git, enabling peer-reviewed `terraform plan` diffs before changes apply.',
        [
          'Store `terraform.tfstate` in an encrypted remote backend with state locking (S3/GCS)',
          'Never commit `.tfvars` secrets or state files to Git',
          'Compose reusable environment modules (dev, staging, prod) sharing identical structure',
        ],
        'Always review `terraform plan` carefully for `-/+` destroy-and-recreate diffs on stateful resources like databases!',
        'hcl',
        'infra/main.tf',
        `resource "google_cloud_run_v2_service" "learntech" {
  name     = "learntech-academy"
  location = var.region
  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }
  }
}`,
        [
          {
            q: 'Why must Terraform remote backends enable state locking?',
            opts: [
              'Prevents two engineers or CI jobs from corrupting infrastructure state by applying concurrently',
              'Locks database tables for users',
              'Compresses HCL files',
              'Disables IAM roles',
            ],
            ans: 0,
            exp: 'Distributed locking serializes state mutations safely.',
          },
          {
            q: 'Why inspect `terraform plan` carefully on stateful database resources?',
            opts: [
              'Changing certain immutable fields triggers destroy-and-recreate, risking data loss',
              'Plan runs the app unit tests',
              'Terraform cannot create databases',
              'HCL does not support strings',
            ],
            ans: 0,
            exp: 'Plan diffs reveal destructive replacements before any change executes.',
          },
          {
            q: 'Why should `terraform.tfstate` never be committed to Git?',
            opts: [
              'State files frequently contain sensitive outputs, connection strings, and merge conflicts',
              'Git forbids JSON files',
              'Terraform deletes .git',
              'Files larger than 1KB fail',
            ],
            ans: 0,
            exp: 'Remote encrypted backends protect state confidentiality and concurrency.',
          },
        ]
      ),
      makeLesson(
        'cloud',
        7,
        'Infrastructure as Code',
        'VPC Networking, Subnets & Least-Privilege IAM',
        '33 min',
        'Isolate private databases inside private subnets and attach narrow IAM service accounts to workloads.',
        'Never expose production databases on public 0.0.0.0/0 security groups. Place compute behind edge load balancers and restrict database ingress strictly to internal VPC peers.',
        [
          'Separate public edge subnets (load balancers) from private app/DB subnets',
          'Use Workload Identity / IAM roles instead of long-lived static JSON service keys',
          'Restrict security group egress and ingress strictly by port and source group',
        ],
        'Short-lived OIDC workload identity tokens eliminate leaked static cloud key files completely.',
        'hcl',
        'infra/iam.tf',
        `resource "google_project_iam_member" "app_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:\${var.app_sa_email}"
}`,
        [
          {
            q: 'Why prefer Workload Identity / OIDC over downloading static service account JSON keys?',
            opts: [
              'Short-lived ephemeral credentials cannot be permanently leaked on disk or in repos',
              'JSON keys do not work on Linux',
              'OIDC disables HTTPS',
              'IAM roles cost extra per byte',
            ],
            ans: 0,
            exp: 'Ephemeral federated identities remove static key rotation headaches.',
          },
          {
            q: 'Where should production relational databases sit in a VPC?',
            opts: [
              'In private subnets unreachable directly from the public internet',
              'Open to 0.0.0.0/0 on port 5432',
              'Inside the browser bundle',
              'On public S3 buckets',
            ],
            ans: 0,
            exp: 'Private subnet isolation removes direct internet attack exposure.',
          },
          {
            q: 'What does `secretmanager.secretAccessor` grant vs `roles/owner`?',
            opts: [
              'Narrow permission solely to read secret values rather than full project control',
              'Full billing deletion rights',
              'Kubernetes cluster deletion',
              'They are identical',
            ],
            ans: 0,
            exp: 'Granular roles minimize impact if an app container is compromised.',
          },
        ]
      ),
      makeLesson(
        'cloud',
        8,
        'CI/CD & Delivery',
        'Immutable Pipelines, OIDC & Artifact Signing',
        '31 min',
        'Build once, scan for CVEs, sign container digests, and promote identical artifacts across environments.',
        'Rebuilding an app separately for staging and production risks testing one build and shipping another. Build an immutable artifact once, verify it in staging, and promote that exact digest.',
        [
          'Run lint, typecheck, unit tests, and vulnerability scans before pushing images',
          'Authenticate GitHub Actions to cloud registries via keyless OIDC federation',
          'Promote verified image SHA digests from staging -> production',
        ],
        'Store deploy secrets in protected environment approvals so pull requests from forks never trigger production deploys.',
        'yaml',
        '.github/workflows/deploy.yml',
        `jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run lint && npm run build`,
        [
          {
            q: 'What does "build once, promote everywhere" mean in CI/CD?',
            opts: [
              'Test the exact same immutable build artifact in staging that gets promoted to production',
              'Compile directly on production servers',
              'Skip staging entirely',
              'Use different Node versions per region',
            ],
            ans: 0,
            exp: 'Promoting identical digests eliminates environment build drift.',
          },
          {
            q: 'Why grant `id-token: write` in GitHub Actions workflows?',
            opts: [
              'Enables keyless OIDC authentication with AWS/GCP instead of long-lived secrets',
              'Writes TypeScript types',
              'Disables branch protection',
              'Compresses ZIP archives',
            ],
            ans: 0,
            exp: 'OIDC mints short-lived scoped tokens per CI job.',
          },
          {
            q: 'Why restrict production deploy triggers on forked pull requests?',
            opts: [
              'Untrusted PR code could otherwise access deploy secrets or infrastructure',
              'Forks cannot run CSS',
              'Git forbids forks',
              'To speed up npm install',
            ],
            ans: 0,
            exp: 'Protecting deployment credentials from untrusted PR workflows is critical.',
          },
        ]
      ),
      makeLesson(
        'cloud',
        9,
        'CI/CD & Delivery',
        'CDN Edge Caching, Anycast DNS & Failover',
        '29 min',
        'Serve static assets in < 20ms globally while routing dynamic APIs cleanly to regional origins.',
        'Content Delivery Networks cache immutable hashed assets (`/assets/app.8f2a.js`) indefinitely at edge POPs while forwarding dynamic `/api/*` traffic over optimized backbones.',
        [
          'Set `Cache-Control: public, max-age=31536000, immutable` on content-hashed JS/CSS/images',
          'Serve `index.html` and `/api/*` with `no-store` or short revalidation so deploys take effect immediately',
          'Configure health-checked DNS / Global Load Balancer failover across regions',
        ],
        'Never cache `index.html` aggressively—users will hold stale HTML pointing to deleted JS chunk hashes after a deploy!',
        'typescript',
        'src/server/cacheHeaders.ts',
        `export function cacheControlForPath(reqPath: string): string {
  if (reqPath.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable';
  }
  return 'no-cache, no-store, must-revalidate';
}`,
        [
          {
            q: 'Why should hashed `/assets/*` files use `immutable` long caching while `index.html` uses `no-cache`?',
            opts: [
              'Updated deploys produce new asset hashes; index.html must stay fresh to reference the new hashes',
              'Browsers cannot cache HTML',
              'Assets expire every 5 seconds',
              'CSS ignores headers',
            ],
            ans: 0,
            exp: 'Caching index.html breaks deploys by referencing old deleted asset filenames.',
          },
          {
            q: 'What does an Edge CDN reduce for global users?',
            opts: [
              'Network round-trip latency and origin server bandwidth load',
              'SQLite table count',
              'TypeScript compile time',
              'Password hash cost',
            ],
            ans: 0,
            exp: 'Edge POPs serve assets geographically close to visitors.',
          },
          {
            q: 'Why avoid caching authenticated `/api/*` JSON responses on shared public CDNs?',
            opts: [
              'Shared caches could serve one user’s private payload to another visitor',
              'JSON cannot be cached',
              'CDNs block GET requests',
              'TLS breaks',
            ],
            ans: 0,
            exp: 'Personalized responses must carry `Cache-Control: private, no-store`.',
          },
        ]
      ),
      makeLesson(
        'cloud',
        10,
        'Reliability & FinOps',
        'SLOs, Error Budgets & Chaos Testing',
        '30 min',
        'Balance feature velocity against reliability using quantitative Service Level Objectives and error budgets.',
        '100% uptime is infinitely expensive and halts all innovation. Setting a 99.9% SLO gives an explicit 43-minute monthly error budget for safe experimentation and deploys.',
        [
          'Define SLIs from real user experience (API success rate, P95 latency)',
          'Freeze risky feature launches whenever the monthly error budget burns out',
          'Practice controlled failure drills (region drain, dependency timeout) in staging',
        ],
        'Always verify backup restores periodically—an untested database backup is only a wish.',
        'typescript',
        'src/ops/slo.ts',
        `export function monthlyErrorBudgetMinutes(sloPercent: number): number {
  const minutesIn30Days = 30 * 24 * 60;
  return Number((minutesIn30Days * (1 - sloPercent / 100)).toFixed(1));
}`,
        [
          {
            q: 'Approximately how much monthly downtime does a 99.9% SLO error budget allow?',
            opts: ['~43 minutes', '~10 hours', '~4 seconds', '3 days'],
            ans: 0,
            exp: '0.1% of 43,200 monthly minutes equals 43.2 minutes.',
          },
          {
            q: 'What should teams do when their error budget is exhausted?',
            opts: [
              'Pause non-critical feature launches and prioritize reliability fixes',
              'Delete monitoring alerts',
              'Raise SLO to 100%',
              'Disable backups',
            ],
            ans: 0,
            exp: 'Error budgets align product and engineering incentives objectively.',
          },
          {
            q: 'Why rehearse database restore drills?',
            opts: [
              'To prove backups are valid, uncorrupted, and restorable within Recovery Time Objectives',
              'To fill up disks',
              'To delete production users',
              'To test CSS hover states',
            ],
            ans: 0,
            exp: 'Restore verification confirms disaster recovery actually works under pressure.',
          },
        ]
      ),
      makeLesson(
        'cloud',
        11,
        'Reliability & FinOps',
        'Cloud Cost Optimization & Scale-to-Zero',
        '27 min',
        'Right-size compute clusters, tune autoscaling, and eliminate idle cloud waste cleanly.',
        'Cloud bills escalate silently from forgotten unattached volumes, oversized instances running at 4% CPU, and unbounded log retention.',
        [
          'Tag every resource by team, environment, and service for clear FinOps attribution',
          'Use scale-to-zero serverless or spot/preemptible nodes for dev and batch workloads',
          'Set log retention policies and lifecycle rules on cold object storage',
        ],
        'Right-sizing compute after observing 2 weeks of real P95 memory/CPU telemetry frequently cuts infrastructure spend by 30–50%.',
        'typescript',
        'src/ops/costEstimate.ts',
        `export function estimateMonthlyComputeCost(avgVcpu: number, pricePerVcpuHour = 0.045): number {
  return Number((avgVcpu * pricePerVcpuHour * 730).toFixed(2));
}`,
        [
          {
            q: 'Why tag every cloud resource with environment and owner metadata?',
            opts: [
              'Enables accurate cost attribution and cleanup of orphaned dev resources',
              'Speeds up Docker builds',
              'Encrypts SQLite',
              'Replaces Terraform',
            ],
            ans: 0,
            exp: 'Cost visibility makes waste obvious and actionable.',
          },
          {
            q: 'Which workloads benefit most from scale-to-zero architectures?',
            opts: [
              'Intermittent traffic, dev environments, and async event processors',
              'Constant 100k RPS core routers',
              'Hardware clock chips',
              'Static CSS strings',
            ],
            ans: 0,
            exp: 'Scale-to-zero eliminates idle compute billing during quiet periods.',
          },
          {
            q: 'What is a common overlooked source of cloud spend?',
            opts: [
              'Verbose debug logs stored forever and unattached orphaned disks',
              'Using TypeScript interfaces',
              'Short CSS class names',
              'gzip compression',
            ],
            ans: 0,
            exp: 'Log ingestion and orphaned storage accumulate quietly over months.',
          },
        ]
      ),
    ],
  },
  {
    slug: 'frontend-development',
    title: 'Modern React, TypeScript & Performance Engineering',
    subtitle: 'Master strict TypeScript, React 19 concurrent patterns, state architecture, Core Web Vitals, and testing.',
    category: 'Frontend Development',
    level: 'Intermediate',
    duration: '15h 45m',
    instructor: 'Maya Lin',
    instructorRole: 'Principal Frontend Engineer',
    coverImage: '/src/assets/images/hero_academy_workspace_1795343842326.jpg',
    accentFrom: '#3b82f6',
    accentTo: '#22d3ee',
    rating: 4.9,
    studentsCount: 6810,
    outcomes: [
      'Model domain invariants cleanly with discriminated TypeScript unions',
      'Eliminate stale closures, redundant effects, and wasted re-renders in React',
      'Optimize LCP, INP, and CLS Core Web Vitals for snappy web apps',
      'Build resilient full-stack SPAs with code splitting and integration tests',
    ],
    lessons: [
      makeLesson(
        'fe',
        1,
        'TypeScript Mastery',
        'Discriminated Unions & Exhaustive Type Safety',
        '30 min',
        'Make impossible UI states unrepresentable using discriminated unions instead of tangled boolean flags.',
        'Tracking `{ isLoading, isError, data }` as three separate booleans invites impossible combinations like loading and error both true. Discriminated unions model exact mutually exclusive states.',
        [
          'Model async views as `{ status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T }`',
          'Use `never` exhaustive checks in switches so new union members fail at compile time',
          'Prefer `unknown` over `any` at API boundaries and narrow with type guards',
        ],
        'Avoid non-null assertions (`!`) and blind `as` casts—let TypeScript narrow values safely through runtime checks.',
        'typescript',
        'src/state/asyncState.ts',
        `export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: T };

export function assertNever(x: never): never {
  throw new Error(\`Unexpected state: \${String(x)}\`);
}`,
        [
          {
            q: 'Why prefer a discriminated union over `{ loading: boolean; error: string | null; data: T | null }`?',
            opts: [
              'It makes contradictory states (like loading + error simultaneously) impossible at compile time',
              'It doubles runtime memory',
              'React forbids booleans',
              'It disables JSX',
            ],
            ans: 0,
            exp: 'Mutually exclusive tagged states eliminate whole classes of UI bugs.',
          },
          {
            q: 'Why choose `unknown` instead of `any` for parsed JSON?',
            opts: [
              'unknown forces explicit type narrowing before property access, preserving type safety',
              'any throws syntax errors',
              'unknown skips parsing',
              'JSON only returns strings',
            ],
            ans: 0,
            exp: 'any turns off type checking silently; unknown keeps safety intact.',
          },
          {
            q: 'What does an exhaustive `never` helper achieve in a switch statement?',
            opts: [
              'Triggers a TypeScript compile error if a new union variant is added and forgotten',
              'Loops infinitely',
              'Deletes dead CSS',
              'Caches network calls',
            ],
            ans: 0,
            exp: 'Compile-time exhaustiveness catches missed cases during refactors.',
          },
        ]
      ),
      makeLesson(
        'fe',
        2,
        'TypeScript Mastery',
        'Generics, Mapped Types & Clean Component APIs',
        '32 min',
        'Design reusable, ergonomic hooks and table/select components powered by TypeScript generics.',
        'Generics let a DataTable or Select component infer exact row and column key types automatically without forcing consumers to cast values.',
        [
          'Constrain generics (`T extends { id: string | number }`) to guarantee required keys',
          'Use `keyof T` so column accessors catch renamed properties at compile time',
          'Keep public component prop interfaces flat, minimal, and predictable',
        ],
        'Overly clever recursive type gymnastics hurt IDE autocomplete speed—keep types readable for your whole team.',
        'typescript',
        'src/components/typedSelect.ts',
        `export interface Option<T extends string> {
  value: T;
  label: string;
}

export function findOptionLabel<T extends string>(options: Option<T>[], value: T): string {
  return options.find((o) => o.value === value)?.label ?? value;
}`,
        [
          {
            q: 'What does `<T extends { id: string }>` guarantee inside a generic function?',
            opts: [
              'Every passed object is guaranteed to have a string `id` property',
              'T can only be a number',
              'T is deleted at runtime',
              'It turns T into an array',
            ],
            ans: 0,
            exp: 'Generic constraints enforce structural contracts while keeping full subtype inference.',
          },
          {
            q: 'How does `keyof T` improve reusable table column definitions?',
            opts: [
              'Misspelled field keys trigger immediate TypeScript errors',
              'It sorts rows automatically',
              'It connects to SQLite',
              'It styles borders',
            ],
            ans: 0,
            exp: 'keyof binds column keys directly to the row data interface.',
          },
          {
            q: 'When do TypeScript generic types exist?',
            opts: [
              'At compile time only—erased cleanly when emitting JavaScript',
              'Inside browser cookies',
              'Inside CSS stylesheets',
              'Only in Node.js',
            ],
            ans: 0,
            exp: 'TypeScript types carry zero runtime bundle overhead.',
          },
        ]
      ),
      makeLesson(
        'fe',
        3,
        'React 19 Architecture',
        'Deriving State & Eliminating Unnecessary Effects',
        '34 min',
        'Simplify React components by computing derived values during render instead of syncing state inside `useEffect`.',
        'Storing `filteredItems` in separate state and updating it via `useEffect` triggers extra double-renders and subtle stale UI flashes. Compute derived values directly during render.',
        [
          'Compute filtered lists, totals, and validation flags inline during render (or `useMemo` when heavy)',
          'Reserve `useEffect` strictly for synchronizing with external systems (fetch, subscriptions, timers)',
          'Always clean up AbortControllers and event listeners inside effect return functions',
        ],
        'Using `key={courseSlug}` on a detail or lesson component resets internal state cleanly when switching routes—zero manual reset effects required.',
        'tsx',
        'src/hooks/derivedFilter.ts',
        `export function filterCourses<T extends { title: string; category: string }>(
  items: T[],
  query: string,
  category: string
): T[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesCat = category === 'All' || item.category === category;
    const matchesQuery = !q || item.title.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });
}`,
        [
          {
            q: 'How should a filtered array of search results be managed in React?',
            opts: [
              'Derived directly during render from source items + searchQuery state',
              'Duplicated in a second useState synced via useEffect',
              'Saved in document.cookie',
              'Fetched from a timer every 100ms',
            ],
            ans: 0,
            exp: 'Deriving during render avoids redundant renders and state sync bugs.',
          },
          {
            q: 'What is a clean way to reset child component state when switching lesson IDs?',
            opts: [
              'Pass `key={lessonId}` to the component',
              'Reload the entire browser tab',
              'Write 5 useEffect hooks',
              'Mutate props directly',
            ],
            ans: 0,
            exp: 'Changing a React key mounts a fresh component instance with clean initial state.',
          },
          {
            q: 'Why return an AbortController cleanup from fetch effects?',
            opts: [
              'Prevents stale out-of-order responses from overwriting newer navigation requests',
              'Speeds up CSS transitions',
              'Encrypts cookies',
              'Disables CORS',
            ],
            ans: 0,
            exp: 'Aborting obsolete fetches eliminates race conditions on fast clicks.',
          },
        ]
      ),
      makeLesson(
        'fe',
        4,
        'React 19 Architecture',
        'Context Architecture & Preventing Render Cascades',
        '31 min',
        'Structure global auth, theme, and notification contexts without re-rendering the entire tree on every keystroke.',
        'Putting rapidly changing values (like mouse coordinates or editor text) into a top-level Context forces every consumer below it to re-render.',
        [
          'Split stable state/actions into separate contexts from high-frequency UI state',
          'Colocate form and filter state inside the lowest common component that needs it',
          'Memoize context provider value objects with `useMemo` and callbacks with `useCallback`',
        ],
        'Keep server state (courses, user profile) clearly separated from ephemeral client UI state (open modals, active tabs).',
        'tsx',
        'src/context/memoProvider.ts',
        `// Pattern: keep context value stable so consumers only re-render when user changes
export function createAuthSnapshot(user: { id: number; email: string } | null, loading: boolean) {
  return { user, loading, isAuthenticated: Boolean(user) };
}`,
        [
          {
            q: 'What happens when you pass a new inline object literal `value={{ user, login }}` to Context.Provider on every render?',
            opts: [
              'Every context consumer re-renders whenever the provider parent re-renders',
              'React freezes',
              'TypeScript fails to compile',
              'Cookies get cleared',
            ],
            ans: 0,
            exp: 'Memoizing the context value object prevents unnecessary consumer updates.',
          },
          {
            q: 'Where should modal open/close or local search input state live?',
            opts: [
              'Locally inside the component or feature subtree that owns it',
              'Always at the root App component',
              'Inside SQLite',
              'In window.name',
            ],
            ans: 0,
            exp: 'State colocation simplifies components and minimizes render scope.',
          },
          {
            q: 'Why separate rapidly changing state (like code editor text) from global AuthContext?',
            opts: [
              'So typing in Monaco Editor does not re-render unrelated navbar and footer trees',
              'Monaco forbids Context',
              'AuthContext deletes strings',
              'To save disk space',
            ],
            ans: 0,
            exp: 'Isolating high-frequency state keeps typing latency instantaneous.',
          },
        ]
      ),
      makeLesson(
        'fe',
        5,
        'React 19 Architecture',
        'Custom Hooks, Error Boundaries & Suspense',
        '32 min',
        'Isolate runtime failures gracefully with Error Boundaries and lazy-load heavy route chunks via Suspense.',
        'An unhandled error in one chart or Monaco pane should never blank out the entire application into a white screen. Error Boundaries catch subtree crashes and render clean recovery UIs.',
        [
          'Lazy-load heavy editors (Monaco) and chart bundles via `React.lazy` + `Suspense`',
          'Wrap major route sections in Error Boundaries with a Retry button',
          'Keep custom hooks focused on single reusable behaviors (`useDebounce`, `useLocalProgress`)',
        ],
        'Remember that Error Boundaries catch rendering/lifecycle errors—event handler and async promise errors still require explicit `try/catch` handling.',
        'tsx',
        'src/hooks/useDebounce.ts',
        `import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}`,
        [
          {
            q: 'What benefit does `React.lazy` give for heavy components like Monaco Editor or Recharts?',
            opts: [
              'Splits heavy JS into separate chunks loaded only when the user visits that route',
              'Deletes TypeScript types',
              'Turns React into PHP',
              'Disables dark mode',
            ],
            ans: 0,
            exp: 'Route/feature code-splitting keeps initial landing page loads ultra-fast.',
          },
          {
            q: 'Do React Error Boundaries catch errors thrown inside `onClick` async handlers?',
            opts: [
              'No—event handlers and async promises must use try/catch and error state',
              'Yes, always',
              'Only on Safari',
              'Only in production',
            ],
            ans: 0,
            exp: 'Error Boundaries catch render and lifecycle errors inside the React tree.',
          },
          {
            q: 'Why debounce live search queries hitting a backend API?',
            opts: [
              'Avoids firing wasteful API requests on every single keystroke',
              'Slows down typing',
              'Breaks accessibility',
              'Clears input text',
            ],
            ans: 0,
            exp: 'Waiting ~250ms after typing pauses cuts redundant network traffic dramatically.',
          },
        ]
      ),
      makeLesson(
        'fe',
        6,
        'Performance & Web Vitals',
        'LCP, INP & CLS Optimization',
        '33 min',
        'Diagnose and optimize Google Core Web Vitals for instant first paint and zero layout shift.',
        'Core Web Vitals measure real perceived speed: Largest Contentful Paint (LCP <= 2.5s), Interaction to Next Paint (INP <= 200ms), and Cumulative Layout Shift (CLS <= 0.1).',
        [
          'Reserve explicit `aspect-video` / `aspect-[4/3]` containers on images so CLS stays 0.00',
          'Never lazy-load above-the-fold hero imagery (`loading="eager"`, `fetchPriority="high"`)',
          'Break up long main-thread JS tasks (> 50ms) to keep INP crisp',
        ],
        'Use `font-display: swap` on web fonts and preload critical font styles so hero headlines appear immediately.',
        'tsx',
        'src/components/MediaFrame.tsx',
        `export function MediaFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-900">
      <img src={src} alt={alt} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
    </div>
  );
}`,
        [
          {
            q: 'How do you prevent Cumulative Layout Shift (CLS) as images load?',
            opts: [
              'Specify explicit aspect-ratio or width/height dimensions on the image container',
              'Use larger JPEG files',
              'Hide images on mobile',
              'Remove alt attributes',
            ],
            ans: 0,
            exp: 'Reserved aspect boxes prevent text below from jumping once images decode.',
          },
          {
            q: 'What does INP (Interaction to Next Paint) measure?',
            opts: [
              'Responsiveness of the UI from user click/tap/keypress to visual frame update',
              'Server disk speed',
              'CSS file count',
              'Password hash rounds',
            ],
            ans: 0,
            exp: 'INP captures main-thread responsiveness across the entire session.',
          },
          {
            q: 'Should your main hero banner image use `loading="lazy"`?',
            opts: [
              'No—lazy-loading above-the-fold LCP images delays first visual completion',
              'Yes, always',
              'Only on desktop',
              'Only on dark themes',
            ],
            ans: 0,
            exp: 'Hero imagery should load eagerly for fast LCP.',
          },
        ]
      ),
      makeLesson(
        'fe',
        7,
        'Performance & Web Vitals',
        'Bundle Splitting, Tree Shaking & Asset Hygiene',
        '28 min',
        'Keep production JavaScript lean using ES module named imports, dynamic imports, and bundle inspection.',
        'Importing an entire utility library (`import _ from "lodash"`) defeats tree-shaking in many setups. Named ESM imports allow Vite/Rollup to prune unused code automatically.',
        [
          'Prefer named ES imports (`import { ChevronRight } from "lucide-react"`)',
          'Inspect production chunk sizes after `npm run build`',
          'Compress SVG icons and raster images appropriately for container sizes',
        ],
        'Avoid importing server-only modules (like `better-sqlite3` or `archiver`) inside `src/` client files—keep strict client/server boundaries.',
        'typescript',
        'src/utils/dynamicImport.ts',
        `export async function loadFormatter() {
  // Dynamically load heavy modules only when invoked
  return { formatCount: (n: number) => n.toLocaleString() };
}`,
        [
          {
            q: 'What does "tree shaking" do during Vite production builds?',
            opts: [
              'Eliminates unreachable unused exports from ES modules to shrink JS bundles',
              'Sorts arrays alphabetically',
              'Runs unit tests',
              'Deletes CSS media queries',
            ],
            ans: 0,
            exp: 'Static ESM import/export graphs let bundlers drop dead code.',
          },
          {
            q: 'Why must Node-only packages (like `fs` or `better-sqlite3`) never be imported in React client components?',
            opts: [
              'Browsers lack Node filesystem APIs and bundlers will fail or bloat',
              'React prefers Python',
              'TypeScript forbids imports',
              'CSS stops working',
            ],
            ans: 0,
            exp: 'Server logic belongs behind Express/API endpoints.',
          },
          {
            q: 'When should a feature module be loaded via dynamic `import()`?',
            opts: [
              'When it is large and only needed on user interaction (e.g. export modal or heavy editor)',
              'For the main navbar wordmark',
              'For every 2-line helper',
              'Never',
            ],
            ans: 0,
            exp: 'On-demand chunks keep initial page startup ultra-light.',
          },
        ]
      ),
      makeLesson(
        'fe',
        8,
        'Styling & Sandboxes',
        'Tailwind v4 Architecture & Responsive Mastery',
        '29 min',
        'Build scalable layouts with Tailwind v4 CSS-first configuration, container queries, and clean utility composition.',
        'Tailwind v4 moves configuration directly into `@import "tailwindcss";` and `@theme`, eliminating heavy JS config overhead and boosting build speed.',
        [
          'Declare `@custom-variant dark (&:where(.dark, .dark *));` when toggling `.dark` manually',
          'Use mobile-first breakpoints (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)',
          'Avoid dynamic string-concatenated class names like `bg-${color}-500` which Purge scanners miss',
        ],
        'Map dynamic variants through explicit lookup objects containing full static class names so Tailwind always generates the CSS.',
        'typescript',
        'src/utils/badgeStyle.ts',
        `const LEVEL_STYLE = {
  Beginner: 'text-emerald-300',
  Intermediate: 'text-cyan-300',
  Advanced: 'text-indigo-300',
} as const;

export function getLevelTextClass(level: keyof typeof LEVEL_STYLE): string {
  return LEVEL_STYLE[level];
}`,
        [
          {
            q: 'Why does `bg-${color}-500` break in Tailwind production builds?',
            opts: [
              'Tailwind statically scans source files for complete class tokens and cannot evaluate runtime template strings',
              'JavaScript forbids template literals',
              'Browsers ignore hyphens',
              'Tailwind only supports red',
            ],
            ans: 0,
            exp: 'Always write complete static class strings inside lookup maps.',
          },
          {
            q: 'How does Tailwind v4 detect custom theme fonts and colors?',
            opts: [
              'Via `@theme { ... }` blocks directly inside your CSS stylesheet',
              'Through SQLite tables',
              'Via XML files',
              'Through browser cookies',
            ],
            ans: 0,
            exp: 'Tailwind v4 is CSS-first with native custom property integration.',
          },
          {
            q: 'What does mobile-first `grid-cols-1 lg:grid-cols-3` mean?',
            opts: [
              'Starts as 1 column on phones and switches to 3 columns at >= 1024px',
              'Shows 3 columns on phones only',
              'Hides columns on desktop',
              'Uses 4 columns everywhere',
            ],
            ans: 0,
            exp: 'Unprefixed classes apply at all sizes; breakpoint prefixes layer upward.',
          },
        ]
      ),
      makeLesson(
        'fe',
        9,
        'Styling & Sandboxes',
        'Browser Code Sandboxes, Web Workers & Monaco',
        '35 min',
        'Embed Monaco Editor cleanly and execute user JavaScript or HTML/CSS safely inside sandboxed iframes.',
        'Running user-written code directly inside the main app `window` exposes cookies, React state, and DOM controls. Isolate preview code inside sandboxed iframes or strict closures.',
        [
          'Use `<iframe sandbox="allow-scripts" srcDoc={...} />` without `allow-same-origin` for untrusted HTML',
          'Capture console logs cleanly and display runtime line errors gracefully',
          'Dispose or reuse Monaco models cleanly so memory does not leak when switching problems',
        ],
        'Combine `allow-scripts` + `allow-same-origin` on an iframe NEVER for untrusted third-party HTML—it lets the iframe remove its own sandbox attribute!',
        'typescript',
        'src/sandbox/safeEval.ts',
        `export function runUserJs(code: string): { logs: string[]; error: string | null } {
  const logs: string[] = [];
  const fakeConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
    error: (...args: unknown[]) => logs.push('ERR: ' + args.map(String).join(' ')),
  };
  try {
    const fn = new Function('console', code);
    fn(fakeConsole);
    return { logs, error: null };
  } catch (err) {
    return { logs, error: err instanceof Error ? err.message : String(err) };
  }
}`,
        [
          {
            q: 'Why must you NEVER combine `allow-scripts` and `allow-same-origin` on an iframe running untrusted HTML?',
            opts: [
              'The embedded script could access the parent origin DOM and strip the sandbox attribute itself',
              'It disables CSS colors',
              'It breaks JSON.parse',
              'Browsers reject srcDoc',
            ],
            ans: 0,
            exp: 'Omitting allow-same-origin puts the iframe in a unique opaque origin.',
          },
          {
            q: 'Why capture `console.log` inside a custom output panel in coding sandboxes?',
            opts: [
              'Learners see immediate execution feedback right inside the workspace without opening DevTools',
              'To hide syntax errors',
              'To speed up Wi-Fi',
              'To disable TypeScript',
            ],
            ans: 0,
            exp: 'Integrated console output keeps focus inside the practice loop.',
          },
          {
            q: 'What happens if Monaco Editor creates new models on every render without cleanup?',
            opts: [
              'Memory consumption grows steadily across problem switches',
              'Code runs faster',
              'CSS resets',
              'Tests pass automatically',
            ],
            ans: 0,
            exp: 'Reusing controlled editor paths or disposing models keeps memory flat.',
          },
        ]
      ),
      makeLesson(
        'fe',
        10,
        'Testing & Quality',
        'Automated Testing Pyramid & Integration Confidence',
        '31 min',
        'Focus test effort on user-visible integration workflows and pure domain logic rather than brittle implementation details.',
        'Testing whether a component calls an internal helper breaks on every refactor. Testing visible DOM output, form submission, and real API contracts catches real user-facing bugs.',
        [
          'Unit test pure business logic (parsers, scorers, validators) thoroughly',
          'Query elements by accessible role/label (`getByRole`, `getByLabelText`) in UI tests',
          'Run end-to-end smoke checks across auth, course completion, and protected redirects',
        ],
        'Never mock away everything in integration tests—verify real HTTP serialization, status codes, and database round-trips.',
        'typescript',
        'src/tests/xpCalc.test.ts',
        `export function calculateTotalXp(lessonsCount: number, problemXps: number[]): number {
  const lessonXp = lessonsCount * 50;
  const practiceXp = problemXps.reduce((sum, x) => sum + x, 0);
  return lessonXp + practiceXp;
}`,
        [
          {
            q: 'Why query elements by accessible role (`getByRole("button")`) in UI tests?',
            opts: [
              'Tests mirror real user and screen-reader interaction while catching missing accessibility semantics',
              'CSS classes never change',
              'It skips rendering',
              'It disables TypeScript',
            ],
            ans: 0,
            exp: 'Accessible queries verify both behavior and semantics simultaneously.',
          },
          {
            q: 'Why are pure domain functions easiest to unit test?',
            opts: [
              'Deterministic inputs produce deterministic outputs with zero network or DOM setup',
              'They require browser extensions',
              'They skip assertions',
              'They run only in CSS',
            ],
            ans: 0,
            exp: 'Extracting pure logic makes testing fast and rock-solid.',
          },
          {
            q: 'What is a brittle test anti-pattern?',
            opts: [
              'Asserting internal React state variable names or private CSS class hashes',
              'Verifying form error text appears on invalid input',
              'Checking API 403 responses',
              'Testing edge-case empty arrays',
            ],
            ans: 0,
            exp: 'Tests tied to internal implementation break during harmless refactors.',
          },
        ]
      ),
      makeLesson(
        'fe',
        11,
        'Testing & Quality',
        'Full-Stack Auth Flows & Client Routing Guards',
        '30 min',
        'Coordinate React Router navigation, server session hydration, and role-protected route redirects cleanly.',
        'Flashing an admin dashboard for 200ms before redirecting looks unpolished and confusing. Wait for session hydration (`authLoading`) before deciding whether to render or redirect.',
        [
          'Maintain a clean `authLoading` flag while `/api/auth/me` resolves on boot',
          'Use `<Navigate to="/signin" replace />` so protected redirects do not pollute browser Back history',
          'Pair client route guards with strict backend middleware verification on every endpoint',
        ],
        'Never rely on client `localStorage.getItem("isAdmin")` flags—authoritative identity always comes from `/api/auth/me` backed by an HttpOnly signed cookie.',
        'tsx',
        'src/routes/ProtectedGuard.ts',
        `export function getRedirectTarget(
  user: { email: string; role: string } | null,
  requireAdmin: boolean
): string | null {
  if (!user) return '/signin';
  if (requireAdmin && user.email.toLowerCase() !== 'admin@example.com') {
    return '/dashboard';
  }
  return null;
}`,
        [
          {
            q: 'Why pass `replace` to `<Navigate to="/signin" replace />` on protected route redirects?',
            opts: [
              'Prevents trapping users in a redirect loop when they press the browser Back button',
              'Deletes cookies',
              'Reloads Vite',
              'Clears CSS styles',
            ],
            ans: 0,
            exp: 'Replacing history entry avoids hitting the forbidden route again on Back.',
          },
          {
            q: 'Why wait for `authLoading` to finish before redirecting on initial page load?',
            opts: [
              'So valid signed-in users are not prematurely kicked to /signin before /api/auth/me responds',
              'To delay rendering forever',
              'To hide logos',
              'To disable React Router',
            ],
            ans: 0,
            exp: 'Hydration completion prevents false-negative redirects on hard refresh.',
          },
          {
            q: 'Where must authoritative admin role verification always happen?',
            opts: [
              'On the backend server before returning any admin data or exports',
              'Only in CSS',
              'In URL hash fragments',
              'In browser localStorage',
            ],
            ans: 0,
            exp: 'Client guards improve UX; server checks enforce real security.',
          },
        ]
      ),
      makeLesson(
        'fe',
        12,
        'Testing & Quality',
        'Production Polish, Resilience & Release Readiness',
        '27 min',
        'Verify offline fallbacks, image resilience, SEO metadata, and zero-broken-handler audits before shipping.',
        'The gap between a demo and a $10,000 production product lies in the final 10%: every image handles fallback cleanly, every button performs real work, and every viewport adapts smoothly.',
        [
          'Verify all `<img />` tags include `alt`, `referrerPolicy="no-referrer"`, and clean fallback containers',
          'Test every page at 375px mobile, 768px tablet, and 1440px desktop widths',
          'Audit `<title>`, meta descriptions, OpenGraph tags, and zero console errors',
        ],
        'Run both TypeScript type-checking (`tsc --noEmit`) and production bundling (`vite build`) before every release.',
        'typescript',
        'src/utils/releaseCheck.ts',
        `export function verifyViewportBreakpoints(widths: number[]): string[] {
  return widths.map((w) => (w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop'));
}`,
        [
          {
            q: 'Why run both `tsc --noEmit` and `vite build` before shipping?',
            opts: [
              'Vite/esbuild strips types without full type-checking, while `tsc` catches type errors Vite skips',
              'They run the exact same check twice',
              'Vite checks Python syntax',
              'tsc generates JPEG images',
            ],
            ans: 0,
            exp: 'Running both ensures type correctness and clean production bundling.',
          },
          {
            q: 'Why include fallback styling behind `<img>` tags?',
            opts: [
              'Guarantees the layout never collapses into ugly broken-image icons if an asset fails',
              'Doubles image resolution',
              'Disables HTTPS',
              'Replaces SVG icons',
            ],
            ans: 0,
            exp: 'Graceful fallbacks protect visual polish under network hiccups.',
          },
          {
            q: 'At which viewport widths should every responsive page be verified?',
            opts: [
              'Mobile (~375px), Tablet (~768px), and Desktop (~1440px)',
              'Only 1440px',
              'Only 320px',
              'Only 4K TVs',
            ],
            ans: 0,
            exp: 'Testing across all three tiers prevents overflow and layout clipping.',
          },
        ]
      ),
    ],
  },
];
