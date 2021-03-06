# ------------ Union of constraints ------------ #

struct ConstrainedUnionSelection <: ConstrainedSelection
    query::Vector{ConstrainedSelection}
end

function has_top(cus::ConstrainedUnionSelection, addr)
    for q in cus.query
        has_top(q, addr) && return true
    end
    return false
end
function dump_queries(cus::ConstrainedUnionSelection)
    arr = Address[]
    for q in cus.query
        append!(arr, collect(dump_queries(q)))
    end
    return arr
end
function get_top(cus::ConstrainedUnionSelection, addr)
    for q in cus.query
        has_top(q, addr) && return get_top(q, addr)
    end
    error("ConstrainedUnionSelection (get_top): query not defined for $addr.")
end

function get_sub(cus::ConstrainedUnionSelection, addr)
    return ConstrainedUnionSelection(map(cus.query) do q
                                         get_sub(q, addr)
                                     end)
end

isempty(cus::ConstrainedUnionSelection) = foldr(x -> isempty(x), cus.query)

# ------------ Unconstrained union selection ------------ #

struct UnconstrainedUnionSelection <: UnconstrainedSelection
    query::Vector{UnconstrainedSelection}
end

function has_top(uus::UnconstrainedUnionSelection, addr)
    for q in uus.query
        has_top(q, addr) && return true
    end
    return false
end

function dump_queries(uus::UnconstrainedUnionSelection)
    arr = Address[]
    for q in uus.query
        append!(arr, collect(dump_queries(q)))
    end
    return arr
end

function get_sub(uus::UnconstrainedUnionSelection, addr)
    return UnconstrainedUnionSelection(map(uus.query) do q
                                           get_sub(q, addr)
                                       end)
end

isempty(uus::UnconstrainedUnionSelection) = isempty(uus.query)
