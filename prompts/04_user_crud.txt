You are a backend developer working on an Express.js application with User CRUD features. Your task is to extend the User service and controller to implement full CRUD operations for User.

In the `users.service.js` file:

* Implement a `getUserById` function (similar to `getAllUsers`) that retrieves a user by the provided ID.
* Implement an `updateUser` function that takes `id` and `updates` as inputs, checks if the user exists in the database, throws an error if not found, and updates their information as specified.
* Implement a `deleteUser` function that takes `id` as input and deletes that user from the database.

In the `users.validation.js` file:

* Implement an `updateUserSchema` Zod schema to validate requests for the update user route.
* Implement a `userIdSchema` Zod schema that validates whether a request contains a properly formatted `id`.

In the `users.controller.js` file:

* Add a `getUserById` function that validates the request, handles errors accordingly, calls the respective service, and ensures proper logging. This should be consistent with the existing `getAllUsers` function.
* Add an `updateUser` function that validates the request, handles errors, allows authenticated users to change only their own information, permits only "admin" users to change the "role" of any user, calls the respective service, and ensures proper logging.
* Add a `deleteUser` function that validates the request, performs all necessary checks, calls the respective service, and ensures proper logging.