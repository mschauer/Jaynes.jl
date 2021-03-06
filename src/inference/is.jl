function importance_sampling(observations::K,
                             num_samples::Int,
                             model::Function, 
                             args::Tuple) where K <: ConstrainedSelection
    calls = Vector{CallSite}(undef, num_samples)
    lws = Vector{Float64}(undef, num_samples)
    Threads.@threads for i in 1:num_samples
        _, calls[i], lws[i] = generate(observations, model, args...)
    end
    ltw = lse(lws)
    lnw = lws .- ltw
    return Particles(calls, lws, 0.0), lnw
end

function importance_sampling(observations::K,
                             num_samples::Int,
                             model::Function, 
                             args::Tuple,
                             proposal::Function,
                             proposal_args::Tuple) where K <: ConstrainedSelection
    calls = Vector{CallSite}(undef, num_samples)
    lws = Vector{Float64}(undef, num_samples)
    Threads.@threads for i in 1:num_samples
        ret, pcall, pw = propose(proposal, proposal_args...)
        select = merge(pcall, observations)
        _, calls[i], lws[i] = generate(select, model, args...)
    end
    ltw = lse(lws)
    lnw = lws .- ltw
    return Particles(calls, lws, 0.0), lnw
end
