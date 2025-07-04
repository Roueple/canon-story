GUIDE FOR PREVIOUS ERRORS

Those errors are a classic result of a strict TypeScript configuration (specifically, the noImplicitAny rule), which is a very good thing to have enabled. It forces us to be explicit about our data types, preventing potential bugs.
The error "Parameter '...' implicitly has an 'any' type" means that TypeScript couldn't figure out the type of the genre and tag objects inside the .map() function, so it defaulted to any, which your configuration correctly flagged as an error.
The fix is simple: we just need to explicitly tell TypeScript what the shape of those objects is.