Prompt 1: Project Scoping & Architectural SetupPlaintextI am building a single-session Expense Splitter application in C++ (with a modern web/desktop frontend interface) based on a specific set of requirements. Here is the project specification:

[PASTED REQUIREMENTS PDF TEXT]

To execute this efficiently within a tight development window, let's establish a clean architecture first:
1. Core Logic & State Management: In-memory state tracking users, expenses, running balances, and debt simplification algorithms.
2. Split Algorithms:
   - Equal splits (handling integer/floating-point division rounding gracefully down to the cent/cent-equivalent).
   - Exact amount splits with validation (ensuring sub-allocations sum precisely to the total expense).
3. Settle Up Logic: Implement a Greedy / Min-Flow algorithm to reduce pairwise debts into the minimal possible settlement transactions.

Please draft the initial project structure, setup instructions, and core logic components so we can implement the foundational features step-by-step.
Prompt 2: Core Algorithmic Debugging (Rounding & Precision Errors)PlaintextI am running testing scenarios on the settlement and balance calculation engines and noticed two precision issues:

1. Floating-Point Mismatch: The "Settle Up" transaction generation is displaying values up to 4 decimal places, whereas the running balance cards restrict output to 2 decimal places. We need a unified currency formatting utility across the application.
2. Indivisible Split Allocation: When dividing an amount like Rs. 1,000 equally among 3 participants (Rs. 333.33 each), the current sum leaves an unaccounted remainder of Rs. 0.01 (Rs. 999.99 total).

Please refactor the split calculation engine to:
- Standardize all currency representation to fixed 2-decimal precision (LKR).
- Implement a remainder distribution mechanism (e.g., assigning the residual cents to the payer or first participant) so that total splits reconcile exactly to the total expense amount without floating-point drift.
Prompt 3: Feature Enhancement (Cash Currency Denomination Settlement)PlaintextWe want to add an additional specialized settlement mode to accommodate real-world physical cash exchanges.

Please implement a "Cash Note Exchange" settlement calculator alongside the standard minimum-transaction engine:
1. Denomination Constraint: Restrict physical cash payouts to standard Sri Lankan Rupee (LKR) banknote denominations: Rs. 5000, 2000, 1000, 100, 50, 20, and 10.
2. Unpayable Residual Debt: Because exact cent/smaller unit settlements are impossible with fixed banknotes, calculate the closest rounded cash settlement each party can make.
3. Rollover Tracking: Any remaining unpayable balance/debt resulting from cash rounding must be segregated and tracked in a dedicated "Unsettled Residual / Debt Carryover" ledger section.
Prompt 4: UX & Architectural RedesignPlaintextThe initial single-page linear flow works, but the user experience needs to be structured more intuitively for single-session workflow efficiency.

Please redesign the main landing view:
1. Dashboard Architecture: Replace the basic landing container with an interactive, modular widget dashboard containing distinct panels for:
   - Group Roster Management
   - Expense Entry & Split Ledger
   - Real-Time Running Balances
   - Settle Up & Cash Exchange Engine
2. Input Guardrails: Ensure navigation between widgets feels seamless while clearly highlighting running totals and net positions at a glance.
Prompt 5: Edge Case Validation & Safety RefactoringPlaintextDuring adversarial testing, I identified a few input validation edge cases and state management risks:

1. Invalid Numeric Inputs: Negative values or out-of-bound percentages (e.g., -2000% or negative exact amounts) can currently be submitted in expense splits. Implement strict validation requiring splits to be strictly positive and percentages to sum to exactly 100%.
2. Unsafe Participant Removal: A participant can currently be deleted from the group while holding active debts or credits. Refactor participant deletion to:
   - Trigger an explicit confirmation modal displaying their net outstanding balance.
   - Maintain a historical "Departed Member Ledger" tracking unresolved debts/gains left behind by removed members.
3. Optional Expense Metadata: Allow non-mandatory optional fields for expenses (e.g., timestamp, Category/Note, and optional receipt attachment details) that enrich expense records without bloating the primary logging workflow.
Prompt 6: Export & Final Artifact GenerationPlaintextThe application is fully implemented, passing all test cases (including the 4-person test scenario from the specification), and all edge cases have been resolved.

Please prepare the final submission documentation requirements:
1. Generate a comprehensive project `README.md` containing:
   - Setup and execution guide.
   - Architectural decisions and assumptions made (e.g., single-currency LKR scope, in-memory persistence strategy for speed).
   - Future roadmap items and technical debt prioritized out of scope.
2. Structure a clear, chronological summary log of our development prompts for evaluation submission.
