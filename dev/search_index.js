var documenterSearchIndex = {"docs":
[{"location":"concepts.html#","page":"-","title":"-","text":"The majority of the concepts used in the initial implementation of this package come from a combination of research papers and research systems (the most notable in the Julia ecosystem is Gen). See Related Work for a comprehensive list of references.","category":"page"},{"location":"concepts.html#Universal-probabilistic-programming-1","page":"-","title":"Universal probabilistic programming","text":"","category":"section"},{"location":"concepts.html#","page":"-","title":"-","text":"Probabilistic programming systems are classified according to their ability to express stochastic computable functions. In particular, languages which restrict allowable forms of control flow or recursion are referred to as first-order probabilistic programming languages. The support of the distribution over samples sites which a first-order program defines can be known at compile time - this implies that these programs can be translated safely to a static graph representation (a Bayesian network). This representation can also be attained if control flow can be unrolled using compiler techniques like constant propagation.","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":"A static graph representation is useful, but it's not sufficient to express all stochastic computable functions. Higher-order or universal probabilistic programming frameworks include the ability to handle stochasticity in control flow bounds and recursion. To achieve this generality, frameworks which support the ability to express these sorts of probabilistic programs are typically restricted to sampling-based inference methods (which essentially reflects the duality between a compiler-based approach to model representation and an interpreter-based approach which requires a number of things to be determined at runtime). Modern systems blur the line between these approaches (see Gen's static DSL for example).","category":"page"},{"location":"concepts.html#The-choice-map-abstraction-1","page":"-","title":"The choice map abstraction","text":"","category":"section"},{"location":"concepts.html#","page":"-","title":"-","text":"One important concept in the universal space is the idea of a map from call sites where random choices occur to the values at those sites. This map is called a choice map in most implementations (original representation in Bher). The semantic interpretation of a probabilistic program expressed in a framework which supports universal probabilistic programming via the choice map abstraction is a distribution over choice maps. Consider the following program, which expresses the geometric distribution in this framework:","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":"geo(p::Float64) = rand(:flip, Bernoulli, (p, )) == 1 ? 0 : 1 + rand(:geo, geo, p)","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":"Here, rand call sites are also given addresses and recursive calls produce a hierarchical address space. A sample from the distribution over choice maps for this program might produce the following map:","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":" :geo => :flip\n          val  = false\n\n flip\n          val  = false\n\n :geo => (:geo => :flip)\n          val  = false\n\n :geo => (:geo => (:geo => :flip))\n          val  = false\n\n :geo => (:geo => (:geo => (:geo => :flip)))\n          val  = true","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":"One simple question arises: what exactly does this distribution over choice maps look like in a mathematical sense? The distribution looks something like this:","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":"P(x)","category":"page"},{"location":"concepts.html#Programming-the-distribution-over-choice-maps-1","page":"-","title":"Programming the distribution over choice maps","text":"","category":"section"},{"location":"concepts.html#","page":"-","title":"-","text":"When interacting with a probabilistic programming framework which utilizes the choice map abstraction, the programming model requires that the user keep unique properties of the desired distribution over choice maps in mind. Here are a set of key difference between classical parametric Bayesian models and universal probabilistic programs:","category":"page"},{"location":"concepts.html#Inference-1","page":"-","title":"Inference","text":"","category":"section"},{"location":"contextual_DSLs.html#","page":"-","title":"-","text":"Often times, developers of probabilistic programming libraries must construct domain-specific languages to express restrictions which are required by the system. An excellent example is MCMC kernel DSLs (or Gaussian process kernel DSLs) where a set of mathematical restrictions (which cannot be enforced by the compiler) must apply to user code for the code to qualify as a valid kernel. The dominant methodology in languages with macro systems is to construct the DSL using macros. The library can check at macro-expansion time if the user has utilized syntax or language features which are disallowed by the DSL, returning immediately to the user to express an error or issue. In extreme cases, the user may only be allowed to use other macros (which represent primitive features of the DSL) inside the DSL macro.","category":"page"},{"location":"contextual_DSLs.html#","page":"-","title":"-","text":"Because Jaynes aims for composability and integration with the compiler, we prefer a complementary viewpoint which \"carves\" the DSL out of the host language. We call this approach contextual domain-specific languages. Because the inclusion of language features is handled by the interpretation context, these DSLs are naturally composable. The interpretation context contains a \"language core\" which is a piece of metadata which tells the interpreter what method calls are allowed in the DSL. Composition of language cores is defined as set intersection (i.e. the minimal feature set which is compatible with both languages). In this perspective, interpretation without a core is just interpretation of the entire host language in the context - nothing is excluded.","category":"page"},{"location":"contextual_DSLs.html#","page":"-","title":"-","text":"Below, we outline our contextual DSLs for MCMC kernels and involutions. Both of these DSLs require exterior mathematical properties to hold true for programs expressed in the DSL. Thus, we've constructed a set of primitives for which these properties hold true. User-constructed programs can then automatically be checked for methods outside of the primitives, given a language core.","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"This is a library which implements probabilistic programming by intercepting calls to rand and interpreting them according to a user-provided context. The interception is automatic through the execution of Julia code, as the interception is provided by compiler injection into an intermediate representation of code (lowered code) using a package called Cassette.","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"Cassette is a very powerful package, but it's also very subtle and easy to cause deep issues in the compilation pipeline. Here, I'm not doing anything too crazy with, say, composition of contexts or compiler pass injection (yet). The basic idea is that you may have some code","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"function foo(x::Float64)\n    y = rand(:y, Normal, (x, 1.0))\n    return y\nend","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"which you want to interpret in a probabilistic programming context. The lowered code looks like this:","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"1 ─ %1 = Core.tuple(x, 1.0)\n│        y = Main.rand(:y, Main.Normal, %1)\n└──      return y","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"After we intercept, the code looks like this:","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"1 ─      #self# = Core.getfield(##overdub_arguments#254, 1)\n│        x = Core.getfield(##overdub_arguments#254, 2)\n│        Cassette.prehook(##overdub_context#253, Core.tuple, x, 1.0)\n│   %4 = Cassette.overdub(##overdub_context#253, Core.tuple, x, 1.0)\n│        Cassette.posthook(##overdub_context#253, %4, Core.tuple, x, 1.0)\n│   %6 = %4\n│        Cassette.prehook(##overdub_context#253, Main.rand, :y, Main.Normal, %6)\n│   %8 = Cassette.overdub(##overdub_context#253, Main.rand, :y, Main.Normal, %6)\n│        Cassette.posthook(##overdub_context#253, %8, Main.rand, :y, Main.Normal, %6)\n│        y = %8\n│   @ REPL[1]:3 within `foo'\n└──      return y","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"notice that every method invocation has been wrapped in a special function (either prehook, overdub, or posthook) which accepts a special structure as first argument (a context). For this conversation, we won't use the special prehook or posthook points of access...","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"1 ─      #self# = Core.getfield(##overdub_arguments#254, 1)\n│        x = Core.getfield(##overdub_arguments#254, 2)\n│   %4 = Cassette.overdub(##overdub_context#253, Core.tuple, x, 1.0)\n│   %6 = %4\n│   %8 = Cassette.overdub(##overdub_context#253, Main.rand, :y, Main.Normal, %6)\n│        y = %8\n│   @ REPL[1]:3 within `foo'\n└──      return y","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"so we'll just discuss overdub. Now, a structured form for the overdub context allows us to record probabilistic statements to a trace. What is a context?","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"Context{N<:Cassette.AbstractContextName,\n        M<:Any,\n        P<:Cassette.AbstractPass,\n        T<:Union{Nothing,Cassette.Tag},\n        B<:Union{Nothing,Cassette.BindingMetaDictCache},\n        H<:Union{Nothing,Cassette.DisableHooks}}","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"where M is metadata. We use a structured trace as metadata","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"mutable struct UnconstrainedGenerateMeta <: Meta\n    tr::Trace\n    stack::Vector{Address}\n    UnconstrainedGenerateMeta(tr::Trace) = new(tr, Address[])\nend","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"and then, with overdub, we intercept rand calls and store the correct location, value, and score in the trace inside the meta.","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"function Cassette.overdub(ctx::TraceCtx{M}, \n                          call::typeof(rand), \n                          addr::T, \n                          dist::Type,\n                          args) where {N, \n                                       M <: UnconstrainedGenerateMeta, \n                                       T <: Address}\n    # Check stack.\n    !isempty(ctx.metadata.stack) && begin\n        push!(ctx.metadata.stack, addr)\n        addr = foldr((x, y) -> x => y, ctx.metadata.stack)\n        pop!(ctx.metadata.stack)\n    end\n\n    # Check for support errors.\n    haskey(ctx.metadata.tr.chm, addr) && error(\"AddressError: each address within a rand call must be unique. Found duplicate $(addr).\")\n\n    d = dist(args...)\n    sample = rand(d)\n    score = logpdf(d, sample)\n    ctx.metadata.tr.chm[addr] = Choice(sample, score)\n    return sample\nend","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"We also keep a stack around to handle hierarchical addressing inside function calls. The stack is essentially a lightweight call stack which tracks where we are while tracing. This lets us get the addressing correct, without doing too much work.","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"Different forms of metadata structure allow us to implement sampling-based inference algorithms efficiently. A ProposalMeta comes with its own overdub dispatch which minimizes calls during a proposal sampling routine:","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"@inline function Cassette.overdub(ctx::TraceCtx{M}, \n                                  call::typeof(rand), \n                                  addr::T, \n                                  dist::Type,\n                                  args) where {M <: ProposalMeta, \n                                               T <: Address}\n    # Check stack.\n    !isempty(ctx.metadata.stack) && begin\n        push!(ctx.metadata.stack, addr)\n        addr = foldr((x, y) -> x => y, ctx.metadata.stack)\n        pop!(ctx.metadata.stack)\n    end\n\n    # Check for support errors.\n    addr in ctx.metadata.visited && error(\"AddressError: each address within a rand call must be unique. Found duplicate $(addr).\")\n\n    d = dist(args...)\n    sample = rand(d)\n    score = logpdf(d, sample)\n    ctx.metadata.tr.chm[addr] = Choice(sample, score)\n    ctx.metadata.tr.score += score\n    push!(ctx.metadata.visited, addr)\n    return sample\n\nend","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"To express inference algorithms, we can mix overdub dispatch on contexts with certain subtypes of Meta. Contexts are re-used during iterative algorithms - the dominant form of allocation is new-ing up blank Trace instances for tracing.","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"function importance_sampling(model::Function, \n                             args::Tuple,\n                             proposal::Function,\n                             proposal_args::Tuple,\n                             observations::Dict{Address, T},\n                             num_samples::Int) where T\n    trs = Vector{Trace}(undef, num_samples)\n    lws = Vector{Float64}(undef, num_samples)\n    prop_ctx = disablehooks(TraceCtx(metadata = ProposalMeta(Trace())))\n    model_ctx = disablehooks(TraceCtx(metadata = GenerateMeta(Trace(), observations)))\n    for i in 1:num_samples\n        # Propose.\n        if isempty(proposal_args)\n            Cassette.overdub(prop_ctx, proposal)\n        else\n            Cassette.overdub(prop_ctx, proposal, proposal_args...)\n        end\n\n        # Merge proposals and observations.\n        prop_score = prop_ctx.metadata.tr.score\n        prop_chm = prop_ctx.metadata.tr.chm\n        constraints = merge(observations, prop_chm)\n        model_ctx.metadata.constraints = constraints\n\n        # Generate.\n        if isempty(args)\n            res = Cassette.overdub(model_ctx, model)\n        else\n            res = Cassette.overdub(model_ctx, model, args...)\n        end\n\n        # Track score.\n        model_ctx.metadata.tr.func = model\n        model_ctx.metadata.tr.args = args\n        model_ctx.metadata.tr.retval = res\n        lws[i] = model_ctx.metadata.tr.score - prop_score\n        trs[i] = model_ctx.metadata.tr\n\n        # Reset.\n        reset_keep_constraints!(model_ctx.metadata)\n        reset_keep_constraints!(prop_ctx.metadata)\n    end\n    ltw = lse(lws)\n    lmle = ltw - log(num_samples)\n    lnw = lws .- ltw\n    return trs, lnw, lmle\nend","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"There are many active probabilistic programming frameworks in the Julia ecosystem (see Related Work) - the long term research goal of Jaynes is to identify composable interfaces for allowing users to express static graphical models alongside dynamic sample-based models. This has previously been a difficult challenge - the representations which each class of probabilistic programming system utilizes is very different. Universal probabilistic programming systems have typically relied on sample-based inference, where the main representation is a structured form of an execution trace. In contrast, graphical model systems reason explicitly about distributions and thus require an explicit graph representation of how random variates depend on one another.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"A priori, there is no reason why these representations can't be combined in some way. The difficulty lies in deciding how to switch between representations when a program is amenable to both, as well as how the different representations will communicate across inference interfaces. For example, consider performing belief propagation on a model which supports both discrete distributions and function call sites for probabilistic programs which required a sample-based tracing mechanism for interpretation. To enable inference routines to operate on this \"call graph\" style representation, we have to construct and reason about the representation separately from the runtime of each program.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"To facilitate these research goals, Jaynes is designed as a type of compiler plugin. In contrast to existing frameworks, Jaynes does not require the use of specialized macros to denote where the modeling language begins and ends. The use of macros to denote a language barrier has a number of positive advantages from a user-facing perspective, but some disadvantages related to composability. As an opinion, I believe that a general framework for expressing probabilistic programs should mimic the philosophy of differentiable programming. The compiler plugin backend should prevent users from writing programs which are \"not valid\" (either as a static analysis or a runtime error) but should otherwise get out of the way of the user. Any macros present in the Jaynes library extend the core functionality or provide convenient access to code generation for use by a user - but are not required for modeling and inference.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"Because Jaynes is a compiler plugin, it is highly configurable. The goal of the core package is to implement a set of \"sensible defaults\" for common use, while allowing the implementation of other DSLs, custom inference algorithms, custom representations, etc on top. In this philosophy, Jaynes follows a path first laid out by Gen...with a few twists.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"Bon appétit!","category":"page"}]
}
