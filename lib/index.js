'use strict';

/**
 * SemiQuiz public API consists of several modules:
 *
 *   * `Compiler` compiles a plain text input into a form descriptor.
 *
 *   * `Reviewer` applies form values to existing form descriptor and
 *     generates a review descriptor.
 *
 */
exports = {
  Compiler: require('./compiler'),
  Reviewer: require('./reviewer')
};