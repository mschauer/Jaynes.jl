import Base.rand
rand(addr::T, d::Type, args) where T <: Address = rand(d(args...))

struct Choice{T}
    val::T
    score::Float64
end

mutable struct Trace
    chm::Dict{Address, Choice}
    score::Float64
    func::Function
    args::Tuple
    retval::Any
    Trace() = new(Dict{Address, Choice}(), 0.0)
end

get_func(tr::Trace) = tr.func
get_args(tr::Trace) = tr.args
get_score(tr::Trace) = tr.score
get_chm(tr::Trace) = tr.chm
get_retval(tr::Trace) = tr.retval