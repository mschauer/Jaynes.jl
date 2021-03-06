# ------------ Utilities ------------ #

function trace_retained(vcs::VectorizedCallSite, 
                        s::K, 
                        ks::Set, 
                        min::Int, 
                        o_len::Int, 
                        n_len::Int, 
                        args...) where K <: UnconstrainedSelection
    w_adj = -sum(map(vcs.trace.subrecords[n_len + 1 : end]) do cl
                     get_score(cl)
                 end)
    new = vcs.trace.subrecords[1 : min - 1]
    new_ret = vcs.ret[1 : min - 1]

    # Start at min
    ss = get_sub(s, min)
    prev_cl = get_sub(vcs, min)
    if min == 1
        ret, u_cl, u_w, rd, ds = regenerate(ss, prev_cl, UndefinedChange(), args...)
    else
        ret, u_cl, u_w, rd, ds = regenerate(ss, prev_cl, UndefinedChange(), new_ret[min - 1])
    end
    push!(new_ret, ret)
    push!(new, u_cl)
    w_adj += u_w

    for i in min + 1 : n_len
        ss = get_sub(s, i)
        prev_cl = get_sub(vcs, i)
        ret, u_cl, u_w, rd, ds = regenerate(ss, prev_cl, UndefinedChange(), new_ret[i - 1]...)
        push!(new_ret, ret)
        push!(new, u_cl)
        w_adj += get_score(u_cl) - get_score(prev_cl)
    end
    return w_adj, new, new_ret
end

function trace_new(vcs::VectorizedCallSite, 
                   s::K, 
                   ks::Set, 
                   min::Int, 
                   o_len::Int, 
                   n_len::Int, 
                   args...) where K <: UnconstrainedSelection
    w_adj = 0.0
    new = vcs.trace.subrecords[1 : min - 1]
    new_ret = vcs.ret[1 : min - 1]

    # Start at min, check if it's less than old length. Otherwise, constraints will be applied during generate.
    if min < o_len
        ss = get_sub(s, min)
        prev_cl = get_sub(vcs, min)
        if min == 1
            ret, u_cl, u_w, rd, ds = regenerate(ss, prev_cl, UndefinedChange(), args...)
        else
            ret, u_cl, u_w, rd, ds = regenerate(ss, prev_cl, UndefinedChange(), new_ret[min - 1])
        end
        push!(new_ret, ret)
        push!(new, u_cl)
        w_adj += u_w

        # From min, apply constraints and compute updates to weight.
        for i in min + 1 : o_len
            ss = get_sub(s, i)
            prev_cl = get_sub(vcs, i)
            ret, u_cl, u_w, rd, ds = regenerate(ss, prev_cl, UndefinedChange(), new_ret[i - 1]...)
            push!(new_ret, ret)
            push!(new, u_cl)
            w_adj += u_w
        end
    end

    # Now, generate new call sites with constraints.
    for i in o_len + 1 : n_len
        ret, g_cl = simulate(vcs.fn, new_ret[i - 1])
        push!(new_ret, ret)
        push!(new, g_cl)
    end

    return w_adj, new, new_ret
end

# ------------ Call sites ------------ #

@inline function (ctx::RegenerateContext{C, T})(c::typeof(markov), 
                                                addr::Address, 
                                                call::Function, 
                                                len::Int,
                                                args...) where {C <: HierarchicalCallSite, T <: HierarchicalTrace}
    vcs = get_prev(ctx, addr)
    n_len, o_len = len, length(vcs.ret)
    s = get_subselection(ctx, addr)
    min, ks = keyset(s, n_len)
    if n_len <= o_len
        w_adj, new, new_ret = trace_retained(vcs, s, ks, min, o_len, n_len, args...)
    else
        w_adj, new, new_ret = trace_new(vcs, s, ks, min, o_len, n_len, args...)
    end
    add_call!(ctx, addr, VectorizedCallSite{typeof(markov)}(VectorizedTrace(new), get_score(vcs) + w_adj, call, n_len, args, new_ret))
    increment!(ctx, w_adj)

    return new_ret
end

@inline function (ctx::RegenerateContext{C, T})(c::typeof(markov), 
                                                addr::Address, 
                                                call::Function, 
                                                len::Int,
                                                args...) where {C <: VectorizedCallSite, T <: VectorizedTrace}
    vcs = ctx.prev
    n_len, o_len = len, length(vcs.ret)
    s = get_subselection(ctx, addr)
    min, ks = keyset(s, n_len)
    if n_len <= o_len
        w_adj, new, new_ret = trace_retained(vcs, s, ks, min, o_len, n_len, args...)
    else
        w_adj, new, new_ret = trace_new(vcs, s, ks, min, o_len, n_len, args...)
    end

    # TODO: fix - allocate full vector.
    for n in new
        add_call!(ctx, n)
    end
    increment!(ctx, w_adj)

    return new_ret
end
