module Profiling

include("../src/Walkman.jl")
using .Walkman
using Distributions
using Profile

function foo1()
    x = rand(:x, Normal, (3.0, 1.0))
    y = rand(:y, Normal, (x, 1.0))
    return y
end

function foo2()
    x = rand(:x, Normal, (3.0, 1.0))
    return x
end

obs = constraints([(:y, 1.0)])
Walkman.importance_sampling(foo1, (), obs, 1)
Profile.clear_malloc_data()
trs, lnw, lmle = @profile Walkman.importance_sampling(foo1, (), obs, 30000)
Profile.print(format=:flat, combine = true, sortedby = :count)

end # module
