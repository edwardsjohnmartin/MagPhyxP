/*******************************************************
 ** Generalized Voronoi Diagram Project               **
 ** Copyright (c) 2015 John Martin Edwards            **
 ** Scientific Computing and Imaging Institute        **
 ** 72 S Central Campus Drive, Room 3750              **
 ** Salt Lake City, UT 84112                          **
 **                                                   **
 ** For information about this project contact        **
 ** John Edwards at                                   **
 **    edwardsjohnmartin@gmail.com                    **
 ** or visit                                          **
 **    sci.utah.edu/~jedwards/research/gvd/index.html **
 *******************************************************/

#ifndef __OPTIONS_H__
#define __OPTIONS_H__

#include <vector>
#include <set>
#include <map>

#include "./Dipole.h"

//------------------------------------------------------------------------------
// Options
//------------------------------------------------------------------------------
struct Options {
 public:
  enum Dynamics { BOUNCING, SLIDING };
  enum StateVariable { NONE, R, THETA, PHI, ALL };

 public:
  bool initialized;
  Dipole dipole;

  std::string outFilename;
  Dynamics dynamics;
  int numEvents;
  int numSteps;
  bool fft;
  double h;
  bool fixed_h;
  double eps;
  bool interactive;
  StateVariable singleStep;
  std::map<std::string, std::string> key2value;
  bool singleSimulation;

 public:
  Options(const int numEvents_, const double h_, const double eps_,
          const Dynamics dynamics_)
      : initialized(false), dynamics(dynamics_),
        numEvents(numEvents_), numSteps(-1), fft(false),
        h(h_), fixed_h(false), eps(eps_),
        interactive(false) {
    ReadOptionsFile();
  }

  bool ProcessArg(int& i, char** argv);

  std::string Value(
    const std::string& key, const std::string& default_value) const;
  bool BoolValue(const std::string& key, const bool default_value) const;
  int IntValue(const std::string& key, const int default_value) const;

  // The options file is key/value pairs, such as
  //   TEST_AMBIGUOUS_GPU 1
  //   DISPLAY_SOMETHING 0
  //   IMPORTANT_MATRIX 1 0 0 0 1 0 0 0 1
  void ReadOptionsFile();

};

// Global Options object. Instantiated in main.cpp.
extern Options o;

#endif
