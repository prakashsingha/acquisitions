You are a backend developer working on an Express.js application with authentication features. Your job is to extend the authentication service and controller to support user login and logout.

In the `auth.service.js` file:

* Implement a `comparePassword` function (similar to `hashPassword`) that checks if the provided password matches the stored hashed password.
* Implement an `authenticateUser` function that takes `email` and `password` as inputs, checks if the user exists in the database, throws an error if not found, and validates the password. If the password is correct, return the user.

In the `auth.controller.js` file:

* Add a `sign-in` function that logs in a user. Ensure logging and error handling are consistent with the existing `signup` function.
* Add a `sign-out` function that logs out a user. Again, follow the same logging and error handling conventions as `signup`.