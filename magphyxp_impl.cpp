/* File : magphyxp.cpp */
#include <iostream>
#include <fstream>
#include <vector>
#include <sstream>

#include <gsl/gsl_errno.h>
#include <gsl/gsl_matrix.h>
#include <gsl/gsl_odeiv2.h>
#include <gsl/gsl_vector.h>
#include <gsl/gsl_multimin.h>

#include "./Dipole.h"
#include "./Physics.h"
#include "./Event.h"
#include "./Options.h"
#include "./Stepper.h"

using namespace std;
 
const Options::Dynamics default_dynamics = Options::BOUNCING;
const double default_n = 1e5;
const double default_h = 1e-2;
const double default_eps = 1e-10;

// Global Options object. Declared in Options.h.
Options o(default_n, default_h, default_eps, default_dynamics);
Dipole doSimulation(const Dipole& freeDipole, Event& event);
Dipole doSimulation(const Dipole& freeDipole);

double period_impl(double ptheta, double pphi, int num_events, double energy) {
  o.numEvents = num_events;
  const double r = 1;
  const double theta = 0.0;
  const double phi = 0.0;
  const double pr = sqrt(abs(2*energy + (cos(phi)+3*cos(phi-2*theta))/
                             (6*r*r*r)-ptheta*ptheta/(r*r)-10*pphi*pphi));
  // -----------------------------
  o.dipole = Dipole(r, theta, phi, pr, ptheta, pphi);
  o.initialized = true;
  
  Dipole freeDipole = o.dipole;
  Dipole endDipole = doSimulation(freeDipole);
  double dist = sqrt((endDipole.get_theta() - freeDipole.get_theta())*
                     (endDipole.get_theta() - freeDipole.get_theta()) + 
                     (endDipole.get_phi() - freeDipole.get_phi())*
                     (endDipole.get_phi() - freeDipole.get_phi()) +
                     (endDipole.get_pr() - freeDipole.get_pr())*
                     (endDipole.get_pr() - freeDipole.get_pr()) +
                     (endDipole.get_ptheta() - freeDipole.get_ptheta())*
                     (endDipole.get_ptheta() - freeDipole.get_ptheta()) +
                     (endDipole.get_pphi() - freeDipole.get_pphi())*
                     (endDipole.get_pphi() - freeDipole.get_pphi()));
  return dist;
}

void printStateHeader() {
  printf("\n");
  printf(" %9s %12s %12s %12s %12s %12s %12s %12s %12s %12s\n",
         "t", "h", "r", "theta", "phi", "pr", "ptheta", "pphi", "E", "dE");
  printf("-------------------------------------------"
         "-------------------------------------------"
         "--------------------------------------------\n");
}

void printState(const double t, const double h, const Dipole& d,
                const char prefix = ' ') {
  printf("%c%9.0lf %12.6g %12.5g %12.6g %12.6g %12.6g"
         "%12.6g %12.6g %12.6g %12.6g\n",
         prefix, t, h,
         d.get_r(), Physics::rad2deg(d.get_theta()),
         Physics::rad2deg(d.get_phi()),
         d.get_pr(), d.get_ptheta(), d.get_pphi(),
         d.get_E(), d.get_dE());
}

void printProgress(const int n, const Dipole& d, const bool fired) {
  if (!o.interactive && (n % 1000 == 0 || n >= o.numEvents) && fired) {
    printf("\r");
    printf("Num collisions = %-7d     dE = %-12e     \n", n, d.get_dE());
    fflush(stdout);
  }
}

bool keepGoing(const Event& event, const int n) {
  if (o.numEvents != -1) {
    return (event.get_n() <= o.numEvents);
  }
  return (n < o.numSteps);
}

Dipole doSimulation(const Dipole& freeDipole, Event& event) {
  const double h_ = o.h;
  const int numEvents = o.numEvents;
  const int numSteps = o.numSteps;

  Stepper stepper(freeDipole, h_, o.fixed_h, o.eps);

  double t = 0.0;
  int n = 0;
  const bool showProgress = (o.outFilename != "" &&
                             o.singleStep == Options::NONE);

  bool verbose = false;

  printf("\n");
  event.printHeader();
  if (o.interactive) {
    printStateHeader();
    printState(0, h_, freeDipole);
  }
  if (showProgress) {
    printProgress(0, freeDipole, true);
  }

  while (keepGoing(event, n)) {
    try {
      stepper.step();
    } catch (logic_error& e) {
      printState(stepper.t, stepper.h, stepper.d);
      throw e;
    }

    if (o.interactive) {
      printState(stepper.t, stepper.h, stepper.d);
      cin.get();
    }

    // Keep theta and phi in the range [-180, 180]
    stepper.d.set_theta(Physics::normalizeAngle(stepper.d.get_theta()));
    stepper.d.set_phi(Physics::normalizeAngle(stepper.d.get_phi()));
    if (stepper.d.get_r() < 1) {
      // Handle collision. Iterate until we get close enough to reflect.
      stepper.undo();
      while (stepper.d.get_r() > 1.0000000000001) {
        stepper.stepHalf();
        if (stepper.d.get_r() < 1) {
          stepper.undo();
        } else {
          event.log(stepper.d, stepper.t);
          ++n;
        }
      }

      event.logCollision(stepper.d, stepper.t);
      if (showProgress) {
        printProgress(event.get_n(), stepper.d, true);
      }
      // Specular reflection
      stepper.d.set_pr(-stepper.d.get_pr());

      stepper.reset();
    } else {
      const bool fired = event.log(stepper.d, stepper.t);
      if (showProgress) {
        printProgress(event.get_n(), stepper.d, fired);
      }
      ++n;
    }
  }

  printf("\n");
  // printStateHeader();
  // printState(0, h_, freeDipole);
  // printState(stepper.t, stepper.h, stepper.d);

  printf("\n");
  if (o.outFilename != "") {
    printf("Results output to %s\n", o.outFilename.c_str());
    printf("\n");
  }
  return freeDipole;
}

Dipole doSimulation(const Dipole& freeDipole) {
  const double h_ = o.h;
  const int numEvents = o.numEvents;
  const int numSteps = o.numSteps;

  Stepper stepper(freeDipole, h_, o.fixed_h, o.eps);
  Dipole toReturn;

  double t = 0.0;
  int n = 0;
  // int m = 0;
  const bool showProgress = (o.outFilename != "" &&
                             o.singleStep == Options::NONE);

  while (n < o.numEvents) {
    try {
      // double currR = stepper.d.get_r();
      stepper.step();
      // double newR = stepper.d.get_r();
      /* if (currR == 1.0 && newR == 1.0) {
        throw "same r value";
      } */
      // ++m;
    } catch (logic_error& e) {
      throw e;
    }
    /* if (m > 100000) {
      throw "too many steps";
    } */

    // Keep theta and phi in the range [-180, 180]
    stepper.d.set_theta(Physics::normalizeAngle(stepper.d.get_theta()));
    stepper.d.set_phi(Physics::normalizeAngle(stepper.d.get_phi()));
    if (stepper.d.get_r() < 1) {
      // Handle collision. Iterate until we get close enough to reflect.
      stepper.undo();
      while (stepper.d.get_r() > 1.0000000000001) {
        stepper.stepHalf();
        if (stepper.d.get_r() < 1) {
          stepper.undo();
        }
      }

      ++n;
      // Specular reflection
      stepper.d.set_pr(-stepper.d.get_pr());

      toReturn = stepper.d;
      stepper.reset();
    }
  }

  // printf("m: %d\n", m);

  return toReturn;
}
