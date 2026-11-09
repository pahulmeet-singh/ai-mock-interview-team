import { Outlet } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { RubricRow } from '@/components/common/RubricRow';
import { ScoreRing } from '@/components/common/ScoreRing';

// The left panel shows a real scorecard (the same components the app uses), so the first screen explains the product.
function SampleScorecard() {
  return (
    <figure className="mt-10 max-w-md rounded-xl border bg-background/50 p-6">
      <div className="flex items-center gap-5">
        <ScoreRing value={7.4} size={92} stroke={8} caption="of 10" />
        <div>
          <figcaption className="font-display text-lg font-semibold leading-tight">Frontend engineering</figcaption>
          <p className="mt-1 text-sm text-muted-foreground">Intermediate, 5 questions</p>
        </div>
      </div>
      <div className="mt-3 divide-y divide-border/60">
        <RubricRow label="Technical accuracy" value={7.6} index={0} className="grid-cols-[8.5rem_1fr_2.5rem]" />
        <RubricRow label="Depth" value={6.9} index={1} className="grid-cols-[8.5rem_1fr_2.5rem]" />
        <RubricRow label="Communication" value={7.8} index={2} className="grid-cols-[8.5rem_1fr_2.5rem]" />
      </div>
    </figure>
  );
}

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="hidden flex-col justify-between border-r bg-card/60 p-12 lg:flex">
        <Logo />
        <div>
          <h2 className="max-w-md font-display text-4xl font-semibold leading-[1.1]">Practise the interview before it counts.</h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Book a slot, answer five questions written for your role, and get a scored report that shows exactly where the marks went.
          </p>
          <SampleScorecard />
        </div>
        <p className="text-xs text-muted-foreground">Scores are produced by an AI model and are meant for practice, not for hiring decisions.</p>
      </aside>

      <main id="main" className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
