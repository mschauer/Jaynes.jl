# ------------ Call sites ------------ #

@inline function (ctx::ParameterBackpropagateContext)(c::typeof(plate),
                                                      addr::T,
                                                      call::Function,
                                                      args::Vector) where T <: Address
    #visit!(ctx.visited, addr)
    vcl = get_sub(ctx.tr, addr)
    param_grads = Gradients()
    params = get_sub(ctx.initial_params, addr)
    ret = simulate_call_pullback(params, param_grads, vcl, args)
    ctx.param_grads.tree[addr] = param_grads
    return ret
end

@inline function (ctx::ChoiceBackpropagateContext)(c::typeof(plate),
                                                   addr::T,
                                                   call::Function,
                                                   args::Vector) where T <: Address
    #visit!(ctx.visited, addr)
    vcl = get_sub(ctx.tr, addr)
    choice_grads = Gradients()
    params = get_sub(ctx.initial_params, addr)
    ret = simulate_choice_pullback(params, choice_grads, get_sub(ctx.select, addr), vcl, args)
    ctx.choice_grads.tree[addr] = choice_grads
    return ret
end
