"use client";

interface Step {
  number: number;
  title: string;
}

const steps: Step[] = [
  { number: 1, title: "Client Details" },
  { number: 2, title: "Item Details" },
  { number: 3, title: "Review" },
];

export function StepIndicator({ currentStep }: { currentStep: number }) {
  const progressWidth = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full max-w-xl mx-auto mb-8 px-4">
      <div className="relative flex justify-between items-start">
        {/* Progress line background */}
        <div className="absolute left-12 right-12 top-5 h-0.5 bg-gray-200" />

        {/* Progress line active */}
        <div
          className="absolute left-12 top-5 h-0.5 bg-orange-500 transition-all duration-500"
          style={{ width: `calc(${progressWidth}% * (100% - 6rem) / 100)` }}
        />

        {/* Steps */}
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          const isPending = currentStep < step.number;

          return (
            <div key={step.number} className="relative flex flex-col items-center z-10 flex-1">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all duration-300
                  ${isActive ? "bg-orange-500 text-white shadow-md ring-4 ring-orange-100" : ""}
                  ${isCompleted ? "bg-orange-500 text-white" : ""}
                  ${isPending ? "bg-white text-gray-400 border-2 border-gray-200" : ""}
                `}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium text-center whitespace-nowrap
                  ${isActive ? "text-orange-600" : ""}
                  ${isCompleted ? "text-orange-500" : ""}
                  ${isPending ? "text-gray-400" : ""}
                `}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
