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
#include <gsl/gsl_math.h>
#include <gsl/gsl_deriv.h>

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

Dipole create_dipole(double ptheta, double pphi, double energy) {
  const double r = 1;
  const double theta = 0.0;
  const double phi = 0.0;
  const double pr = sqrt(abs(2*energy + (cos(phi)+3*cos(phi-2*theta))/
                             (6*r*r*r)-ptheta*ptheta/(r*r)-10*pphi*pphi));
  // -----------------------------
  o.dipole = Dipole(r, theta, phi, pr, ptheta, pphi);
  o.initialized = true;
  
  Dipole freeDipole = o.dipole;
  return freeDipole;
}

// An implementation of the f() function to find the distance
// in phase space from the initial conditions after num_events.
double period_impl(double ptheta, double pphi, int num_events, double energy) {
  o.numEvents = num_events;
  Dipole freeDipole = create_dipole(ptheta, pphi, energy);
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

//---------------------------------------------------------------------------
// Minimization code
//---------------------------------------------------------------------------

double my_f (const gsl_vector* v, void* params) {
  // double x, y, z, m, n;
  Dipole toUse;

  double theta = gsl_vector_get(v, 0);
  double phi = gsl_vector_get(v, 1);
  double ptheta = gsl_vector_get(v, 2);
  double pphi = gsl_vector_get(v, 3);

  double* E = (double*)params;
  double pr2 = abs(2*(*E) + (cos(phi) + 3*cos(phi - 2*theta))/
                       (6*1*1*1) - ptheta*ptheta/(1*1) - 10*pphi*pphi);

  if (pr2 < 0.0) {
    exit(EXIT_FAILURE);
  }

  double pr = sqrt(pr2);

  toUse.set_r(1);
  toUse.set_theta(theta);
  toUse.set_phi(phi);
  toUse.set_pr(pr);
  toUse.set_ptheta(ptheta);
  toUse.set_pphi(pphi);

  Dipole endDipole = doSimulation(toUse);

  return (theta - endDipole.get_theta())*(theta - endDipole.get_theta()) + 
         (phi - endDipole.get_phi())*(phi - endDipole.get_phi()) + 
         (pr - endDipole.get_pr())*(pr - endDipole.get_pr()) + 
         (ptheta - endDipole.get_ptheta())*(ptheta - endDipole.get_ptheta()) +
         (pphi - endDipole.get_pphi())*(pphi - endDipole.get_pphi());
}

struct f_params {
  f_params(int param_, const gsl_vector* p_, double E_) {
    param = param_;
    p = p_;
    // for (int i = 0; i < 4; ++i) {
    //   params[i] = params_[i];
    // }
    E = E_;
  }
  int param;
  // double params[4];
  const gsl_vector* p;
  double E;
};

double f(double x_, void* params_) {
  f_params fparams = *((f_params*)params_);
  gsl_vector* v = gsl_vector_alloc(4);
  for (int i = 0; i < 4; ++i) {
    gsl_vector_set(v, i, gsl_vector_get(fparams.p, i));
  }
  gsl_vector_set(v, fparams.param, x_);
  double ret = my_f(v, &fparams.E);
  gsl_vector_free(v);
  return ret;
}

void my_df (const gsl_vector* v, void* params, gsl_vector* df) {
  const double h = 0.0001;
  const double E = *(double*)(params);
  for (int i = 0; i < 4; ++i) {
    f_params fparams(i, v, E);
    gsl_function F;
    F.function = &f;
    F.params = &fparams;
    double result, abserr;
    gsl_deriv_central(&F, gsl_vector_get(v, i), h, &result, &abserr);
    gsl_vector_set(df, i, result);
  }
}

struct Minimum {
  double ptheta;
  double pphi;
  double f;
};

Minimum calculate_min_impl(double ptheta, double pphi,
                     int num_events, double energy, double step_size) {
  o.numEvents = num_events;
  Dipole freeDipole = create_dipole(ptheta, pphi, energy);
  unsigned int iter = 0;
  int status;

  const gsl_multimin_fminimizer_type *T;
  gsl_multimin_fminimizer *s;

  gsl_vector *x;
  gsl_vector *simplex_step;
  gsl_multimin_function my_func;
  double size;

  my_func.n = 4;
  my_func.f = my_f;
  // -----------------------
  double param = freeDipole.get_E();
  my_func.params = &param;
  // -----------------------

  x = gsl_vector_alloc(4);
  gsl_vector_set(x, 0, freeDipole.get_theta());
  gsl_vector_set(x, 1, freeDipole.get_phi());
  gsl_vector_set(x, 2, freeDipole.get_ptheta());
  gsl_vector_set(x, 3, freeDipole.get_pphi());
  

  T = gsl_multimin_fminimizer_nmsimplex2;
  s = gsl_multimin_fminimizer_alloc (T, 4);

  simplex_step = gsl_vector_alloc (4);
  gsl_vector_set(simplex_step, 0, step_size);
  gsl_vector_set(simplex_step, 1, step_size);
  gsl_vector_set(simplex_step, 2, step_size);
  gsl_vector_set(simplex_step, 3, step_size);
  gsl_multimin_fminimizer_set(s, &my_func, x, simplex_step);

  // FILE* file = fopen("minimums.txt", "w");

  do {
    iter++;
    status = gsl_multimin_fminimizer_iterate(s);

    // printf ("error: %s\n", gsl_strerror (status));

    if (status)
      break;

    size = gsl_multimin_fminimizer_size(s);
    status = gsl_multimin_test_size(size, 1e-7);

    if (status == GSL_SUCCESS) {
      /* printf ("\nMinimum found at:\n");
      printf ("%5d %.5f %.5f %.5f %.5f %.5f %10.10f\n", iter,
        Physics::rad2deg(gsl_vector_get (s->x, 0)),
        Physics::rad2deg(gsl_vector_get (s->x, 1)),
        sqrt(2*param + (cos(gsl_vector_get (s->x, 1)) + 3*cos(gsl_vector_get (s->x, 1) - 2*gsl_vector_get (s->x, 0)))/(6*1*1*1) - gsl_vector_get (s->x, 2)*gsl_vector_get (s->x, 2)/(1*1) - 10*gsl_vector_get (s->x, 3)*gsl_vector_get (s->x, 3)),
        gsl_vector_get (s->x, 2),
        gsl_vector_get (s->x, 3),
        s->fval); */
    }

      /* printf ("%5d %.5f %.5f %.5f %.5f %.5f %10.10f\n", iter,
        Physics::rad2deg(gsl_vector_get (s->x, 0)),
        Physics::rad2deg(gsl_vector_get (s->x, 1)),
        sqrt(2*param + (cos(gsl_vector_get (s->x, 1)) + 3*cos(gsl_vector_get (s->x, 1) - 2*gsl_vector_get (s->x, 0)))/(6*1*1*1) - gsl_vector_get (s->x, 2)*gsl_vector_get (s->x, 2)/(1*1) - 10*gsl_vector_get (s->x, 3)*gsl_vector_get (s->x, 3)),
        gsl_vector_get (s->x, 2),
        gsl_vector_get (s->x, 3),
        s->fval); */

      double theta = Physics::rad2deg(gsl_vector_get (s->x, 0));
      double phi = Physics::rad2deg(gsl_vector_get (s->x, 1));
      double pr = sqrt(2*param + (cos(gsl_vector_get (s->x, 1)) + 3*cos(gsl_vector_get (s->x, 1) - 2*gsl_vector_get (s->x, 0)))/(6*1*1*1) - gsl_vector_get (s->x, 2)*gsl_vector_get (s->x, 2)/(1*1) - 10*gsl_vector_get (s->x, 3)*gsl_vector_get (s->x, 3));
      double ptheta = gsl_vector_get (s->x, 2);
      double pphi = gsl_vector_get (s->x, 3);

      double values[5] = { theta, phi, pr, ptheta, pphi };

      for (int i = 0; i < 5; i++) {
        if (abs(values[i] - 0.0) <= 0.0001) {
          values[i] = 0.0;
        }
      }

      // fprintf(file, "%d %.4f %.4f %.4f %.4f %.4f %.5f\n", 
      //     1,
      //     values[0],
      //     values[1],
      //     values[2],
      //     values[3],
      //     values[4],
      //     s->fval);

  } while (status == GSL_CONTINUE && iter < 1000);

  /* double theta = Physics::rad2deg(gsl_vector_get (s->x, 0));
  double phi = Physics::rad2deg(gsl_vector_get (s->x, 1));
  double pr = sqrt(2*param + (cos(gsl_vector_get (s->x, 1)) + 3*cos(gsl_vector_get (s->x, 1) - 2*gsl_vector_get (s->x, 0)))/(6*1*1*1) - gsl_vector_get (s->x, 2)*gsl_vector_get (s->x, 2)/(1*1) - 10*gsl_vector_get (s->x, 3)*gsl_vector_get (s->x, 3));
  double ptheta = gsl_vector_get (s->x, 2);
  double pphi = gsl_vector_get (s->x, 3);

  double values[5] = { theta, phi, pr, ptheta, pphi };

  for (int i = 0; i < 5; i++) {
    if (abs(values[i] - 0.0) <= 0.0001) {
      values[i] = 0.0;
    }
  } */

  // FILE* file = fopen("minimums.txt", "w");
  // fprintf(file, "r, theta, phi, pr, ptheta, pphi, fval\n");
  /* fprintf(file, "%d %.4f %.4f %.4f %.4f %.4f %.5f\n", 
          1,
          values[0],
          values[1],
          values[2],
          values[3],
          values[4],
          s->fval); */
  // fclose(file);
  // file = fopen("iters.txt", "w");
  // fprintf(file, "%d\n", iter);
  // fclose(file);

  Minimum ret = {
    gsl_vector_get(s->x, 2), gsl_vector_get(s->x, 3), s->fval };

  gsl_multimin_fminimizer_free (s);
  gsl_vector_free (x);

  return ret;
}
