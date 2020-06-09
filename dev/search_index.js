var documenterSearchIndex = {"docs":
[{"location":"concepts.html#","page":"-","title":"-","text":"The majority of the concepts used in the initial implementation of this package come from a combination of research papers and research systems (the most notable in the Julia ecosystem is Gen). See Related Work for a comprehensive list of references.","category":"page"},{"location":"concepts.html#Universal-probabilistic-programming-1","page":"-","title":"Universal probabilistic programming","text":"","category":"section"},{"location":"concepts.html#","page":"-","title":"-","text":"Probabilistic programming systems are classified according to their ability to express stochastic computable functions. In particular, languages which restrict allowable forms of control flow or recursion are referred to as first-order probabilistic programming languages. The support of the distribution over samples sites which a first-order program defines can be known at compile time - this implies that these programs can be translated safely to a static graph representation (a Bayesian network). This representation can also be attained if control flow can be unrolled using compiler techniques like constant propagation.","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":"A static graph representation is useful, but it's not sufficient to express all stochastic computable functions. Higher-order or universal probabilistic programming frameworks include the ability to handle stochasticity in control flow bounds and recursion. To achieve this generality, frameworks which support the ability to express these sorts of probabilistic programs are typically restricted to sampling-based inference methods (which essentially reflects the duality between a compiler-based approach to model representation and an interpreter-based approach which requires a number of things to be determined at runtime). Modern systems blur the line between these approaches (see Gen's static DSL for example).","category":"page"},{"location":"concepts.html#The-choice-map-abstraction-1","page":"-","title":"The choice map abstraction","text":"","category":"section"},{"location":"concepts.html#","page":"-","title":"-","text":"One important concept in the universal space is the idea of a map from call sites where random choices occur to the values at those sites. This map is called a choice map in most implementations (original representation in Bher). The semantic interpretation of a probabilistic program expressed in a framework which supports universal probabilistic programming via the choice map abstraction is a distribution over choice maps. Consider the following program, which expresses the geometric distribution in this framework:","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":"geo(p::Float64) = rand(:flip, Bernoulli, (p, )) == 1 ? 0 : 1 + rand(:geo, geo, p)","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":"Here, rand call sites are also given addresses and recursive calls produce a hierarchical address space. A sample from the distribution over choice maps for this program might produce the following map:","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":" :geo => :flip\n          val  = false\n\n flip\n          val  = false\n\n :geo => (:geo => :flip)\n          val  = false\n\n :geo => (:geo => (:geo => :flip))\n          val  = false\n\n :geo => (:geo => (:geo => (:geo => :flip)))\n          val  = true","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":"One simple question arises: what exactly does this distribution over choice maps look like in a mathematical sense? The distribution looks something like this:","category":"page"},{"location":"concepts.html#","page":"-","title":"-","text":"P(x)","category":"page"},{"location":"concepts.html#Programming-the-distribution-over-choice-maps-1","page":"-","title":"Programming the distribution over choice maps","text":"","category":"section"},{"location":"concepts.html#","page":"-","title":"-","text":"When interacting with a probabilistic programming framework which utilizes the choice map abstraction, the programming model requires that the user keep unique properties of the desired distribution over choice maps in mind. Here are a set of key difference between classical parametric Bayesian models and universal probabilistic programs:","category":"page"},{"location":"concepts.html#Inference-1","page":"-","title":"Inference","text":"","category":"section"},{"location":"contextual_DSLs.html#","page":"Contextual domain-specific languages","title":"Contextual domain-specific languages","text":"Often times, developers of machine learning systems must construct domain-specific languages to express restrictions which are required by the system, but can't be expressed solely through the type system. An excellent example is MCMC kernel DSLs (or Gaussian process kernel DSLs) where a set of mathematical restrictions (which cannot be enforced by the compiler) must apply to user code for the code to qualify as valid in the kernel interpretation. Restricted languages which enable efficient (and cohesive) automatic differentiation are another example. ","category":"page"},{"location":"contextual_DSLs.html#","page":"Contextual domain-specific languages","title":"Contextual domain-specific languages","text":"One of the dominant methodologies in languages with macro systems is to construct the DSL using macros. The library can check at macro-expansion time if the user has utilized syntax or language features which are disallowed by the DSL, returning immediately to the user to express an error or issue. In extreme cases, the user may only be allowed to use other macros (which represent primitive features of the DSL) inside the DSL macro. Because Jaynes aims for a broad standard of composability as a plugin to the compiler, we prefer a complementary viewpoint which \"carves\" the DSL out of the host language. This viewpoint can also be found in the philosophy of packages such as Zygote where the user is allowed to write arbitrary code, but may encounter a runtime error if Zygote is unable to identify and emit pullback code for a method call (i.e. the user has stepped outside the bounds of the language (or set of ChainRules) which the system knows how to differentiate). ","category":"page"},{"location":"contextual_DSLs.html#","page":"Contextual domain-specific languages","title":"Contextual domain-specific languages","text":"We call our approach to this viewpoint contextual domain-specific languages because the inclusion of any language feature representable by a method call is handled by the interpretation context. The interpretation context contains a \"language core\" which is a piece of metadata which tells the interpreter what method calls are allowed in the DSL. These cores have a natural set of operations: set intersection is the minimal feature set which is compatible with both languages, where union is the set which covers both. Interpretation without a core is just interpretation of the entire host language in the context - nothing is excluded.","category":"page"},{"location":"contextual_DSLs.html#","page":"Contextual domain-specific languages","title":"Contextual domain-specific languages","text":"In our system, these languages are only active for specific contexts (i.e. those associated with the validation of construction of kernels or programming in the graphical model DSL) - so this section is purely optional. These languages are designed to help a user construct a program which is valid according to the assumptions of the domain - but they incur a small runtime cost (equivalent to normal Cassette execution with a call to prehook before overdub). For inference contexts, these language restrictions can be turned on and off by the user.","category":"page"},{"location":"contextual_DSLs.html#","page":"Contextual domain-specific languages","title":"Contextual domain-specific languages","text":"","category":"page"},{"location":"contextual_DSLs.html#","page":"Contextual domain-specific languages","title":"Contextual domain-specific languages","text":"As an example of this idea, here's a small functional core which performs runtime checks to prevent the use of mutation on mutable structures or key-accessed collections:","category":"page"},{"location":"contextual_DSLs.html#","page":"Contextual domain-specific languages","title":"Contextual domain-specific languages","text":"ctx = DomainCtx(metadata = Language(BaseLang()))\n\nmutable struct Foo\n    x::Float64\nend\n\nfunction foo(z::Float64)\n    z = Foo(10.0)\n    x = 10\n    if x < 15\n        y = 20\n    end\n    y += 1\n    z.x = 10.0\n    return y\nend\n\n# Accepted!\nret = interpret(ctx, foo, 5.0)\n\n@corrode! BaseLang setfield!\n@corrode! BaseLang setproperty!\n@corrode! BaseLang setindex!\n\n# Rejected!\nret = interpret(ctx, foo, 5.0)\n\n# ERROR: LoadError: Main.LanguageCores.Jaynes.BaseLangError: setproperty! with Tuple{Main.LanguageCores.Foo,Symbol,Float64} is disallowed in this language.","category":"page"},{"location":"contextual_DSLs.html#","page":"Contextual domain-specific languages","title":"Contextual domain-specific languages","text":"BaseLang lets all calls through. We corrode BaseLang to prevent calls to setfield!, setproperty!, and setindex!. Note that, at the method level, we can't prevent re-assignment to variables because assignment is not a method. If we wanted to, we could prevent this using an IR pass. We could extend this to prevent iteration-based control flow:","category":"page"},{"location":"contextual_DSLs.html#","page":"Contextual domain-specific languages","title":"Contextual domain-specific languages","text":"function foo(z::Float64)\n    z = Foo(10.0)\n    x = 10\n    for i in 1:10\n        println(i)\n    end\n    if x < 15\n        y = 20\n    end\n    y += 1\n    z.x = 10.0\n    return y\nend\n\n@corrode! BaseLang iterate\n\n# Rejected!\nret = interpret(ctx, foo, 5.0)\n\n# ERROR: LoadError: Main.LanguageCores.Jaynes.BaseLangError: iterate with Tuple{UnitRange{Int64}} is disallowed in this language.","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"This is a library which implements probabilistic programming by intercepting calls to rand and interpreting them according to a user-provided context. The interception is automatic through the execution of Julia code, as the interception is provided by compiler injection into an intermediate representation of code (lowered code) using a package called Cassette.","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"Cassette is a very powerful package, but it's also very subtle and easy to cause deep issues in the compilation pipeline. Here, I'm not doing anything too crazy with, say, composition of contexts or compiler pass injection (yet). The basic idea is that you may have some code","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"function foo(x::Float64)\n    y = rand(:y, Normal, (x, 1.0))\n    return y\nend","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"which you want to interpret in a probabilistic programming context. The lowered code looks like this:","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"1 ─ %1 = Core.tuple(x, 1.0)\n│        y = Main.rand(:y, Main.Normal, %1)\n└──      return y","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"After we intercept, the code looks like this:","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"1 ─      #self# = Core.getfield(##overdub_arguments#254, 1)\n│        x = Core.getfield(##overdub_arguments#254, 2)\n│        Cassette.prehook(##overdub_context#253, Core.tuple, x, 1.0)\n│   %4 = Cassette.overdub(##overdub_context#253, Core.tuple, x, 1.0)\n│        Cassette.posthook(##overdub_context#253, %4, Core.tuple, x, 1.0)\n│   %6 = %4\n│        Cassette.prehook(##overdub_context#253, Main.rand, :y, Main.Normal, %6)\n│   %8 = Cassette.overdub(##overdub_context#253, Main.rand, :y, Main.Normal, %6)\n│        Cassette.posthook(##overdub_context#253, %8, Main.rand, :y, Main.Normal, %6)\n│        y = %8\n│   @ REPL[1]:3 within `foo'\n└──      return y","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"notice that every method invocation has been wrapped in a special function (either prehook, overdub, or posthook) which accepts a special structure as first argument (a context). For this conversation, we won't use the special prehook or posthook points of access...","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"1 ─      #self# = Core.getfield(##overdub_arguments#254, 1)\n│        x = Core.getfield(##overdub_arguments#254, 2)\n│   %4 = Cassette.overdub(##overdub_context#253, Core.tuple, x, 1.0)\n│   %6 = %4\n│   %8 = Cassette.overdub(##overdub_context#253, Main.rand, :y, Main.Normal, %6)\n│        y = %8\n│   @ REPL[1]:3 within `foo'\n└──      return y","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"so we'll just discuss overdub. Now, a structured form for the overdub context allows us to record probabilistic statements to a trace. What is a context?","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"Context{N<:Cassette.AbstractContextName,\n        M<:Any,\n        P<:Cassette.AbstractPass,\n        T<:Union{Nothing,Cassette.Tag},\n        B<:Union{Nothing,Cassette.BindingMetaDictCache},\n        H<:Union{Nothing,Cassette.DisableHooks}}","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"where M is metadata. We use a structured trace as metadata","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"mutable struct UnconstrainedGenerateMeta <: Meta\n    tr::Trace\n    stack::Vector{Address}\n    UnconstrainedGenerateMeta(tr::Trace) = new(tr, Address[])\nend","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"and then, with overdub, we intercept rand calls and store the correct location, value, and score in the trace inside the meta.","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"function Cassette.overdub(ctx::TraceCtx{M}, \n                          call::typeof(rand), \n                          addr::T, \n                          dist::Type,\n                          args) where {N, \n                                       M <: UnconstrainedGenerateMeta, \n                                       T <: Address}\n    # Check stack.\n    !isempty(ctx.metadata.stack) && begin\n        push!(ctx.metadata.stack, addr)\n        addr = foldr((x, y) -> x => y, ctx.metadata.stack)\n        pop!(ctx.metadata.stack)\n    end\n\n    # Check for support errors.\n    haskey(ctx.metadata.tr.chm, addr) && error(\"AddressError: each address within a rand call must be unique. Found duplicate $(addr).\")\n\n    d = dist(args...)\n    sample = rand(d)\n    score = logpdf(d, sample)\n    ctx.metadata.tr.chm[addr] = Choice(sample, score)\n    return sample\nend","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"We also keep a stack around to handle hierarchical addressing inside function calls. The stack is essentially a lightweight call stack which tracks where we are while tracing. This lets us get the addressing correct, without doing too much work.","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"Different forms of metadata structure allow us to implement sampling-based inference algorithms efficiently. A ProposalMeta comes with its own overdub dispatch which minimizes calls during a proposal sampling routine:","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"@inline function Cassette.overdub(ctx::TraceCtx{M}, \n                                  call::typeof(rand), \n                                  addr::T, \n                                  dist::Type,\n                                  args) where {M <: ProposalMeta, \n                                               T <: Address}\n    # Check stack.\n    !isempty(ctx.metadata.stack) && begin\n        push!(ctx.metadata.stack, addr)\n        addr = foldr((x, y) -> x => y, ctx.metadata.stack)\n        pop!(ctx.metadata.stack)\n    end\n\n    # Check for support errors.\n    addr in ctx.metadata.visited && error(\"AddressError: each address within a rand call must be unique. Found duplicate $(addr).\")\n\n    d = dist(args...)\n    sample = rand(d)\n    score = logpdf(d, sample)\n    ctx.metadata.tr.chm[addr] = Choice(sample, score)\n    ctx.metadata.tr.score += score\n    push!(ctx.metadata.visited, addr)\n    return sample\n\nend","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"To express inference algorithms, we can mix overdub dispatch on contexts with certain subtypes of Meta. Contexts are re-used during iterative algorithms - the dominant form of allocation is new-ing up blank Trace instances for tracing.","category":"page"},{"location":"architecture.html#","page":"Implementation architecture","title":"Implementation architecture","text":"function importance_sampling(model::Function, \n                             args::Tuple,\n                             proposal::Function,\n                             proposal_args::Tuple,\n                             observations::Dict{Address, T},\n                             num_samples::Int) where T\n    trs = Vector{Trace}(undef, num_samples)\n    lws = Vector{Float64}(undef, num_samples)\n    prop_ctx = disablehooks(TraceCtx(metadata = ProposalMeta(Trace())))\n    model_ctx = disablehooks(TraceCtx(metadata = GenerateMeta(Trace(), observations)))\n    for i in 1:num_samples\n        # Propose.\n        if isempty(proposal_args)\n            Cassette.overdub(prop_ctx, proposal)\n        else\n            Cassette.overdub(prop_ctx, proposal, proposal_args...)\n        end\n\n        # Merge proposals and observations.\n        prop_score = prop_ctx.metadata.tr.score\n        prop_chm = prop_ctx.metadata.tr.chm\n        constraints = merge(observations, prop_chm)\n        model_ctx.metadata.constraints = constraints\n\n        # Generate.\n        if isempty(args)\n            res = Cassette.overdub(model_ctx, model)\n        else\n            res = Cassette.overdub(model_ctx, model, args...)\n        end\n\n        # Track score.\n        model_ctx.metadata.tr.func = model\n        model_ctx.metadata.tr.args = args\n        model_ctx.metadata.tr.retval = res\n        lws[i] = model_ctx.metadata.tr.score - prop_score\n        trs[i] = model_ctx.metadata.tr\n\n        # Reset.\n        reset_keep_constraints!(model_ctx.metadata)\n        reset_keep_constraints!(prop_ctx.metadata)\n    end\n    ltw = lse(lws)\n    lmle = ltw - log(num_samples)\n    lnw = lws .- ltw\n    return trs, lnw, lmle\nend","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"There are many active probabilistic programming frameworks in the Julia ecosystem (see Related Work) - the ecosystem is one of the richest sources of probabilistic programming research in any language. Frameworks tend to differentiate themselves based upon what model class they efficiently express (Stheno for example allows for convenient expression of Gaussian processes). Other frameworks support universal probabilistic programming with sample-based methods, and have optimized features which allow the efficient composition/expression of inference queries (e.g. Turing and Gen). Jaynes sits within this latter camp - it is strongly influenced by Turing and Gen, but more closely resembles a system like Zygote. The full-scope Jaynes system will allow you to express the same things you might express in these other systems - but the long term research goals may deviate slightly from these other libraries. In this section, I will discuss a few of the long term goals.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"","category":"page"},{"location":"index.html#Graphical-model-DSL-1","page":"Introduction","title":"Graphical model DSL","text":"","category":"section"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"One of the research goals of Jaynes is to identify composable interfaces for allowing users to express static graphical models alongside dynamic sample-based models. This has previously been a difficult challenge - the representations which each class of probabilistic programming system utilizes is very different. Universal probabilistic programming systems have typically relied on sample-based inference, where the main representation is a structured form of an execution trace. In contrast, graphical model systems reason explicitly about distributions and thus require an explicit graph representation of how random variates depend on one another.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"A priori, there is no reason why these representations can't be combined in some way. The difficulty lies in deciding how to switch between representations when a program is amenable to both, as well as how the different representations will communicate across inference interfaces. For example, consider performing belief propagation on a model which supports both discrete distributions and function call sites for probabilistic programs which required a sample-based tracing mechanism for interpretation. To enable inference routines to operate on this \"call graph\" style representation, we have to construct and reason about the representation separately from the runtime of each program.","category":"page"},{"location":"index.html#Density-compilation-1","page":"Introduction","title":"Density compilation","text":"","category":"section"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"TODO.","category":"page"},{"location":"index.html#Automatic-inference-compilation-1","page":"Introduction","title":"Automatic inference compilation","text":"","category":"section"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"Jaynes already provides (rudimentary) support for gradient-based learning in probabilistic programs. Jaynes also provides a simple interface to construct and use inference compilers. The library function inference_compilation provides access to the inference compiler context. The result of inference compilation is a trained inference compiler context which can be used to generate traces for the posterior conditioned on observations.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"function foo1()\n    x = rand(:x, Normal, (3.0, 10.0))\n    y = rand(:y, Normal, (x + 15.0, 0.3))\n    return y\nend\n\nctx = inference_compilation(foo1, (), :y; batch_size = 256, epochs = 100)\nobs = constraints([(:y, 10.0)])\nctx, tr, score = trace(ctx, obs)","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"The user must provide a target observation address to the inference_compilation call. This allows the inference compiler to construct an observation-specific head during training.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"This inference method is not yet fully tested - but you can take a peek in the src to see how it will eventually be stabilized. One of the long term goals of Jaynes is to provide a backend for inference compilation of arbitary programs. If a user does not specify the choice map structure of the program, the addresses will be automatically filled in, with enough reference metadata to allow the user to locate the rand call in the original program. Of course, it is always preferable to structure your own choice map space - this feature is intended to allow programs with untraced rand calls to utilize a useful (but possibly limited) form of inference.","category":"page"},{"location":"index.html#Black-box-extensions-1","page":"Introduction","title":"Black-box extensions","text":"","category":"section"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"Jaynes is equipped with the ability to extend the tracing interface to black-box code. This is naturally facilitated by the metaprogramming capabilities of Cassette. The primary usage of this extension is to define new logpdf method definitions for code which may contain sources of randomness which are not annotated with addresses and/or where inspection by the tracing mechanism can be safely abstracted over. Thus, @primitive defines a contract between the user and the tracer - we assume that what you're doing is correct and we're not going to check you on it!","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"The following example shows how this extension mechanism works.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"function foo(y::Float64)\n    # Untraced randomness.\n    y = rand(Normal(0.5, 3.0))\n    return y\nend\n\n@primitive function logpdf(fn::typeof(foo), args::Tuple{Float64}, y::Float64)\n    if y < 1.0\n        log(1) \n    else\n        -Inf\n    end\nend\n\nfunction bar(z::Float64)\n    y = rand(:y, foo, (z, ))\n    return y\nend\n\nctx = Generate(Trace())\nret = trace(ctx, bar, (0.3, ))\nprintln(ctx.metadata.tr)\n\n#  __________________________________\n#\n#               Playback\n#\n# y\n#          val  = 2.8607525733342767\n#\n#  __________________________________\n#\n# score : 0.0\n#\n#  __________________________________\n","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"@primitive requires that the user define a logpdf definition for the call. This expands into overdub method definitions for the tracer which automatically work with all the core library context/metadata dispatch. The signature for logpdf should match the following type specification:","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"logpdf(::typeof(your_func), ::Tuple, ::T)","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"where T is the return type of your_func. ","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"Note that, if your defined logpdf is differentiable - gradients will automatically be derived for use in Gradient learning contexts as long as Zygote can differentiate through it. This can be used to e.g. train neural networks in Gradient contexts where the loss is wrapped in the logpdf/@primitive interface mechanism.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"The extension mechanism does not check if the user-defined logpdf is valid. This mechanism also overrides the normal fallback (i.e. tracing into calls) for any function for which the mechanism is used to write a logpdf - this means that if you write a logpdf using this mechanism for a call and there is addressed randomness in the call, it will be ignored by the tracer.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"","category":"page"},{"location":"index.html#Summary-1","page":"Introduction","title":"Summary","text":"","category":"section"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"To facilitate these research goals, Jaynes is designed as a type of compiler plugin. In contrast to existing frameworks, Jaynes does not require the use of specialized macros to denote where the modeling language begins and ends. The use of macros to denote a language barrier has a number of positive advantages from a user-facing perspective, but some disadvantages related to composability. As an opinion, I believe that a general framework for expressing probabilistic programs should mimic the philosophy of differentiable programming. The compiler plugin backend should prevent users from writing programs which are \"not valid\" (either as a static analysis or a runtime error) but should otherwise get out of the way of the user. Any macros present in the Jaynes library extend the core functionality or provide convenient access to code generation for use by a user - but are not required for modeling and inference.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"Because Jaynes is a compiler plugin, it is highly configurable. The goal of the core package is to implement a set of \"sensible defaults\" for common use, while allowing the implementation of other DSLs, custom inference algorithms, custom representations, etc on top. In this philosophy, Jaynes follows a path first laid out by Gen and Zygote...with a few twists.","category":"page"},{"location":"index.html#","page":"Introduction","title":"Introduction","text":"Bon appétit!","category":"page"}]
}
