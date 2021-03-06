macro load_gen_fmi()
    @info "Loading foreign model interface to \u001b[3m\u001b[34;1mGen.jl\u001b[0m\n\n          \u001b[34;1mhttps://www.gen.dev/\n\nThis interface currently supports Gen's full feature set.\n\n\u001b[1mGen and Jaynes share exports - please qualify usage of the following context APIs:\n\u001b[0m\n \u001b[31msimulate   \u001b[0m-> \u001b[32mJaynes.simulate\n \u001b[31mgenerate   \u001b[0m-> \u001b[32mJaynes.generate\n \u001b[31mupdate     \u001b[0m-> \u001b[32mJaynes.update\n \u001b[31mregenerate \u001b[0m-> \u001b[32mJaynes.regenerate\n \u001b[31mpropose    \u001b[0m-> \u001b[32mJaynes.propose\n "
    expr = quote
        import Jaynes: has_top, get_top, has_sub, get_sub, get_score, collect, collect!, selection
        import Jaynes: simulate, propose, generate, regenerate, update, score
        using Gen

        # ------------ Trace ------------ #

        mutable struct GenTrace{T <: Gen.Trace} <: Jaynes.Trace
            tr::T
            GenTrace(tr::T) where T = new{T}(tr)
            GenTrace{T}() where T = new{T}()
        end
        add_call!(st::GenTrace, addr, tr) = st.tr = tr
        get_choices(tr::GenTrace) = Gen.get_choices(tr.tr)
        
        # ------------ Call site ------------ #

        struct GenerativeFunctionCallSite{M <: GenerativeFunction, A, K} <: Jaynes.CallSite
            trace::GenTrace
            score::Float64
            model::M
            args::A
            ret::K
        end

        get_score(gfcs::GenerativeFunctionCallSite) = gfcs.score
        haskey(cs::GenerativeFunctionCallSite, addr) = has_value(get_choices(cs.trace), addr)
        getindex(cs::GenerativeFunctionCallSite, addrs...) = getindex(get_choices(cs.trace), addrs...)
        get_ret(cs::GenerativeFunctionCallSite) = get_retval(cs.trace)
        get_choices(cs::GenerativeFunctionCallSite) = get_choices(cs.trace)

        # ------------ Choice map integration ------------ #

        function create_pairs(v::Vector{Pair})
            out = []
            for (t, l) in v
                push!(out, (foldr(=>, t), l))
            end
            out
        end

        function selection(chm::C) where C <: Gen.ChoiceMap
            s = Jaynes.ConstrainedHierarchicalSelection()
            for (k, v) in Gen.get_values_shallow(chm)
                push!(s, k, v)
            end
            for (k, v) in Gen.get_submaps_shallow(chm)
                sub = selection(v)
                s.tree[k] = sub
            end
            s
        end

        # ------------ Contexts ------------ #

        function (ctx::Jaynes.SimulateContext)(c::typeof(foreign),
                                               addr::A,
                                               gen_fn::M,
                                               args...) where {A <: Jaynes.Address, M <: GenerativeFunction}
            Jaynes.visit!(ctx, addr)
            tr = Gen.simulate(gen_fn, args)
            Jaynes.add_call!(ctx, addr, GenerativeFunctionCallSite(GenTrace(tr), Gen.get_score(tr), gen_fn, args, Gen.get_retval(tr)))
            return Gen.get_retval(tr)
        end

        # Convenience.
        function simulate(gen_fn::G, args...) where G <: Gen.GenerativeFunction
            ctx = Jaynes.Simulate()
            addr = gensym()
            ret = ctx(foreign, addr, gen_fn, args...)
            return ret, get_sub(ctx.tr, addr)
        end

        function (ctx::Jaynes.ProposeContext)(c::typeof(foreign),
                                              addr::A,
                                              gen_fn::M,
                                              args...) where {A <: Jaynes.Address, M <: GenerativeFunction}
            Jaynes.visit!(ctx, addr)
            tr, w, ret = Gen.propose(gen_fn, args, choice_map)
            Jaynes.add_call!(ctx, addr, GenerativeFunctionCallSite(GenTrace(tr), Gen.get_score(tr), gen_fn, args, Gen.get_retval(tr)))
            Jaynes.increment!(ctx, w)
            return ret
        end

        # Convenience.
        function propose(gen_fn::G, args...) where G <: Gen.GenerativeFunction
            ctx = Propose()
            addr = gensym()
            ret = ctx(foreign, addr, gen_fn, args...)
            return ret, get_top(ctx.tr, addr), ctx.score
        end

        function (ctx::Jaynes.GenerateContext)(c::typeof(foreign),
                                               addr::A,
                                               gen_fn::M,
                                               args...) where {A <: Jaynes.Address, M <: GenerativeFunction}
            Jaynes.visit!(ctx, addr)
            constraints = Jaynes.dump_queries(Jaynes.get_sub(ctx.select, addr))
            pairs = create_pairs(constraints)
            choice_map = Gen.choicemap(pairs...)
            tr, w = Gen.generate(gen_fn, args, choice_map)
            ret = Gen.get_retval(tr)
            Jaynes.add_call!(ctx, addr, GenerativeFunctionCallSite(GenTrace(tr), Gen.get_score(tr), gen_fn, args, ret))
            Jaynes.increment!(ctx, w)
            return ret
        end

        # Convenience.
        function generate(sel::L, gen_fn::G, args...) where {L <: Jaynes.ConstrainedSelection, G <: Gen.GenerativeFunction}
            addr = gensym()
            v_sel = selection(addr => sel)
            ctx = Generate(v_sel)
            ret = ctx(foreign, addr, gen_fn, args...)
            return ret, get_sub(ctx.tr, addr), ctx.weight
        end

        function (ctx::Jaynes.UpdateContext)(c::typeof(foreign),
                                             addr::A,
                                             gen_fn::M,
                                             args...) where {A <: Jaynes.Address, M <: GenerativeFunction}
            Jaynes.visit!(ctx, addr)
            constraints = Jaynes.dump_queries(Jaynes.get_sub(ctx.select, addr))
            pairs = create_pairs(constraints)
            choice_map = Gen.choicemap(pairs...)
            prev = Jaynes.get_prev(ctx, addr)
            new, w, rd, d = Gen.update(prev.trace, args, (), choice_map)
            Jaynes.add_call!(ctx, addr, GenerativeFunctionCallSite(GenTrace(new), Gen.get_score(new), gen_fn, args, Gen.get_retval(new)))
            Jaynes.increment!(ctx, w)
            return Gen.get_retval(new)
        end

        # Convenience.
        function update(sel::L, gen_cl::C) where {L <: Jaynes.ConstrainedSelection, C <: GenerativeFunctionCallSite}
            addr = gensym()
            v_sel = selection(addr => sel)
            ctx = Jaynes.UpdateContext(v_sel, gen_cl, Jaynes.NoChange())
            ret = ctx(foreign, addr, gen_cl.model, gen_cl.args...)
            return ret, get_sub(ctx.tr, addr), ctx.weight, Jaynes.UndefinedChange(), nothing
        end

        function (ctx::Jaynes.RegenerateContext)(c::typeof(foreign),
                                                 addr::A,
                                                 gen_fn::M,
                                                 args...) where {A <: Jaynes.Address, M <: GenerativeFunction}
            Jaynes.visit!(ctx, addr)
            constraints = Jaynes.dump_queries(Jaynes.get_sub(ctx.select, addr))
            select = Gen.select(constraints...)
            prev = Jaynes.get_prev(ctx, addr)
            new, w, rd = Gen.regenerate(prev.trace.tr, args, (), select)
            ret = Gen.get_retval(new)
            Jaynes.add_call!(ctx, addr, GenerativeFunctionCallSite(GenTrace(new), Gen.get_score(new), gen_fn, args, ret))
            Jaynes.increment!(ctx, Gen.get_score(new) - Jaynes.get_score(prev))
            return ret
        end

        function (ctx::Jaynes.RegenerateContext{C})(c::typeof(foreign),
                                                    addr::A,
                                                    gen_fn::M,
                                                    args...) where {A <: Jaynes.Address, M <: GenerativeFunction, C <: GenerativeFunctionCallSite}
            Jaynes.visit!(ctx, addr)
            constraints = Jaynes.dump_queries(Jaynes.get_sub(ctx.select, addr))
            println(constraints)
            select = Gen.select(constraints...)
            println(select)
            prev = ctx.prev
            new, w, rd = Gen.regenerate(prev.trace.tr, args, (), select)
            ret = Gen.get_retval(new)
            ctx.tr.tr = new
            ctx.score += Gen.get_score(new)
            Jaynes.increment!(ctx, Gen.get_score(new) - Jaynes.get_score(prev))
            return ret
        end

        # Convenience.
        function regenerate(sel::L, gen_cl::C) where {L <: Jaynes.UnconstrainedSelection, C <: GenerativeFunctionCallSite}
            addr = gensym()
            v_sel = selection(addr => sel)
            ctx = Jaynes.Regenerate(gen_cl, v_sel, Jaynes.NoChange())
            ret = ctx(foreign, addr, gen_cl.model, gen_cl.args...)
            return ret, GenerativeFunctionCallSite(ctx.tr, ctx.score, gen_cl.model, gen_cl.args, ret), ctx.weight, Jaynes.UndefinedChange(), nothing
        end

        function (ctx::Jaynes.ScoreContext)(c::typeof(foreign),
                                            addr::Jaynes.Address,
                                            gen_fn::M,
                                            args...) where M <: GenerativeFunction
            Jaynes.visit!(ctx, addr)
            constraints = Jaynes.dump_queries(Jaynes.get_sub(ctx.select, addr))
            pairs = create_pairs(constraints)
            choice_map = Gen.choicemap(pairs...)
            w, ret = Gen.assess(gen_fn, args, choice_map)
            Jaynes.increment!(ctx, w)
            return ret
        end

        # Convenience.
        function score(sel::L, gen_fn::M, args...) where {L <: Jaynes.UnconstrainedSelection, M <: GenerativeFunctionCallSite}
            addr = gensym()
            v_sel = selection(addr => sel)
            ctx = Jaynes.Score(v_sel)
            ret = ctx(foreign, addr, gen_fn, args...)
            return ret, ctx.weight
        end

        # ------------ Pretty printing ------------ #

        function collect!(par::P, addrs::Vector{Any}, chd::Dict{Any, Any}, chm::M, meta) where {P <: Tuple, M <: Gen.ChoiceMap}
            for (k, v) in get_values_shallow(chm)
                push!(addrs, (par..., k))
                chd[(par..., k)] = v
                meta[(par..., k)] = "(Gen)"
            end
            for (k, v) in get_submaps_shallow(chm)
                collect!((par..., k), addrs, chd, v, meta)
            end
        end

        function collect!(par::P, addrs::Vector{Any}, chd::Dict{Any, Any}, tr::T, meta) where {P <: Tuple, T <: GenTrace}
            choices = get_choices(tr.tr)
            for (k, v) in get_values_shallow(choices)
                push!(addrs, (par..., k))
                chd[(par..., k)] = v
                meta[(par..., k)] = "(Gen)"
            end
            for (k, v) in get_submaps_shallow(choices)
                collect!((par..., k), addrs, chd, v, meta)
            end
        end

        function collect!(addrs::Vector{Any}, chd::Dict{Any, Any}, chm::M, meta) where M <: Gen.ChoiceMap
            for (k, v) in get_values_shallow(chm)
                push!(addrs, (k, ))
                chd[(k, )] = v
            end
            for (k, v) in get_submaps_shallow(chm)
                collect!((k, ), addrs, chd, v, meta)
            end
        end

        function collect!(addrs::Vector{Any}, chd::Dict{Any, Any}, tr::T, meta) where T <: GenTrace
            choices = get_choices(tr.tr)
            for (k, v) in get_values_shallow(choices)
                push!(addrs, (k, ))
                chd[(k, )] = v
            end
            for (k, v) in get_submaps_shallow(choices)
                collect!((k, ), addrs, chd, v, meta)
            end
        end
    end

    expr = MacroTools.prewalk(unblock ∘ rmlines, expr)
    esc(expr)
end
