# Allows updating of CodeInfo instances with new IR.
function update!(ci::Core.CodeInfo, ir::Core.Compiler.IRCode)
  Core.Compiler.replace_code_newstyle!(ci, ir, length(ir.argtypes)-1)
  ci.inferred = false
  ci.ssavaluetypes = length(ci.code)
  slots!(ci)
  fill!(ci.slotflags, 0)
  return ci
end

function update!(ci::Core.CodeInfo, ir::IR)
  if ir.meta isa Meta
    ci.method_for_inference_limit_heuristics = ir.meta.method
    if isdefined(ci, :edges)
      ci.edges = Core.MethodInstance[ir.meta.instance]
    end
  end
  update!(ci, Core.Compiler.IRCode(slots!(ir)))
end

# This is a pass which indicates to native Cassette passes that the only thing of interest is calls to rand.
function ignore_transform(::Type{<:TraceCtx}, r::Reflection)
    syn = r.code_info.code
    map(syn) do expr
        MacroTools.postwalk(expr) do k
            # If you already wrapped, don't wrap.
            k isa Expr && k.head == :call && begin
                arg = k.args[1]
                arg isa Expr && arg.head == :nooverdub && return k
            end

            # If you haven't wrapped, wrap.
            k isa Expr && k.head == :call && begin
                call = k.args[1]
                if !(call isa GlobalRef && call.name == :rand)
                    k.args[1] = Expr(:nooverdub, call)
                    return k
                end
            end
            
            k
        end
    end
    return r.code_info
end

const ignore_pass = Cassette.@pass ignore_transform