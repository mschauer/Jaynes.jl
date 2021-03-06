mutable struct ScoreContext{P <: Parameters} <: ExecutionContext
    select::ConstrainedSelection
    weight::Float64
    visited::Visitor
    params::P
    function Score(obs::Vector{Tuple{K, P}}) where {P, K <: Union{Symbol, Pair}}
        c_sel = selection(obs)
        new{EmptyParameters}(c_sel, 0.0, Parameters())
    end
    ScoreContext(obs::K, params::P) where {K <: ConstrainedSelection, P <: Parameters} = new{P}(obs, 0.0, Visitor(), params)
end
Score(obs::Vector) = ScoreContext(selection(obs))
Score(obs::ConstrainedSelection) = ScoreContext(obs, Parameters())
Score(obs::ConstrainedSelection, params) = ScoreContext(obs, params)

# ------------ Convenience ------------ #

function score(sel::L, fn::Function, args...) where L <: ConstrainedSelection
    ctx = Score(sel)
    ret = ctx(fn, args...)
    b, missed = compare(sel.query, ctx.visited)
    b || error("ScoreError: did not visit all constraints in selection.\nDid not visit: $(missed).")
    return ret, ctx.weight
end

function score(sel::L, params, fn::Function, args...) where L <: ConstrainedSelection
    ctx = Score(sel, params)
    ret = ctx(fn, args...)
    b, missed = compare(sel.query, ctx.visited)
    b || error("ScoreError: did not visit all constraints in selection.\nDid not visit: $(missed).")
    return ret, ctx.weight
end

function score(sel::L, fn::typeof(rand), d::Distribution{K}) where {L <: ConstrainedSelection, K}
    ctx = Score(sel)
    addr = gensym()
    ret = ctx(fn, addr, d)
    b, missed = compare(sel.query, ctx.visited)
    b || error("ScoreError: did not visit all constraints in selection.\nDid not visit: $(missed).")
    return ret, ctx.weight
end

# TODO: fix for dispatch on params.
function score(sel::L, fn::typeof(markov), call::Function, len::Int, args...; params = Parameters()) where L <: ConstrainedSelection
    addr = gensym()
    v_sel = selection(addr => sel)
    ctx = Score(v_sel, params)
    ret = ctx(fn, addr, call, len, args...)
    b, missed = compare(sel.query, ctx.visited)
    b || error("ScoreError: did not visit all constraints in selection.\nDid not visit: $(missed).")
    return ret, ctx.weight
end

function score(sel::L, fn::typeof(plate), call::Function, args::Vector; params = Parameters()) where L <: ConstrainedSelection
    ctx = Score(sel, params)
    addr = gensym()
    ret = ctx(fn, addr, call, args)
    b, missed = compare(sel.query, ctx.visited)
    b || error("ScoreError: did not visit all constraints in selection.\nDid not visit: $(missed).")
    return ret, ctx.weight
end

function score(sel::L, fn::typeof(plate), d::Distribution{K}, len::Int; params = Parameters()) where {L <: ConstrainedSelection, K}
    addr = gensym()
    v_sel = selection(addr => sel)
    ctx = Score(v_sel, params)
    ret = ctx(fn, addr, d, len)
    b, missed = compare(sel.query, ctx.visited)
    b || error("ScoreError: did not visit all constraints in selection.\nDid not visit: $(missed).")
    return ret, ctx.weight
end

# ------------ includes ------------ #

include("hierarchical/score.jl")
include("plate/score.jl")
include("markov/score.jl")
include("factor/score.jl")

# ------------ Documentation ------------ #

@doc(
"""
```julia
mutable struct ScoreContext{P <: Parameters} <: ExecutionContext
    select::ConstrainedSelection
    weight::Float64
    params::P
end
```

The `ScoreContext` is used to score selections according to a model function. For computation in the `ScoreContext` to execute successfully, the `select` selection must provide a choice for every address visited in the model function, and the model function must allow the context to visit every constraints expressed in `select`.

Inner constructors:

```julia
function Score(obs::Vector{Tuple{K, P}}) where {P, K <: Union{Symbol, Pair}}
    c_sel = selection(obs)
    new{EmptyParameters}(c_sel, 0.0, Parameters())
end
```

Outer constructors:

```julia
ScoreContext(obs::K, params) where {K <: ConstrainedSelection} = new(obs, 0.0, params)
Score(obs::Vector) = ScoreContext(selection(obs))
Score(obs::ConstrainedSelection) = ScoreContext(obs, Parameters())
Score(obs::ConstrainedSelection, params) = ScoreContext(obs, params)
```
""", ScoreContext)

@doc(
"""
```julia
ret, w = score(sel::L, fn::Function, args...; params = Parameters()) where L <: ConstrainedSelection
ret, w = score(sel::L, fn::typeof(rand), d::Distribution{K}; params = Parameters()) where {L <: ConstrainedSelection, K}
ret, w = score(sel::L, fn::typeof(markov), call::Function, len::Int, args...; params = Parameters()) where L <: ConstrainedSelection
ret, w = score(sel::L, fn::typeof(plate), call::Function, args::Vector; params = Parameters()) where L <: ConstrainedSelection
ret, w = score(sel::L, fn::typeof(plate), d::Distribution{K}, len::Int; params = Parameters()) where {L <: ConstrainedSelection, K}
```

`score` provides an API to the `ScoreContext` execution context. You can use this function on any of the matching signatures above - it will return the return value `ret`, and the likelihood weight score of the user-provided selection `sel`. The selection should satisfy the following requirement:

1. At any random choice in any branch traveled according to the constraints of `sel`, `sel` must provide a constraint for that choice.

Simply put, this just means you need to provide a constraint for each `ChoiceSite` you encounter.
""", score)
