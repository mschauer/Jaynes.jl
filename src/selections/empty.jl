# ----------- Empty constrained selection ------------ #

struct ConstrainedEmptySelection <: ConstrainedSelection end

has_top(cas::ConstrainedEmptySelection, addr) = false
dump_queries(cas::ConstrainedEmptySelection) = Set()
get_top(cas::ConstrainedEmptySelection, addr) = error("ConstrainedEmptySelection has no queries!")
get_sub(cas::ConstrainedEmptySelection, addr) = cas
isempty(cas::ConstrainedEmptySelection) = true
function merge(cl::T, sel::ConstrainedEmptySelection) where T <: CallSite
    cl_selection = get_selection(cl)
    return cl_selection
end

# Pretty printing.
function Base.display(chs::ConstrainedEmptySelection; show_values = false)
    println("  __________________________________\n")
    println("            Empty Selection\n")
    println("  __________________________________\n")
end

# ----------- Empty unconstrained selection ------------ #

struct UnconstrainedEmptySelection <: UnconstrainedSelection end

has_top(uas::UnconstrainedEmptySelection, addr) = false
dump_queries(uas::UnconstrainedEmptySelection) = Set()
get_sub(cas::UnconstrainedEmptySelection, addr) = cas
isempty(cas::UnconstrainedEmptySelection) = true

