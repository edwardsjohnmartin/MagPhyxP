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
// #include "./Stepper.h"

using namespace std;

const Options::Dynamics default_dynamics = Options::BOUNCING;
const double default_n = 1e5;
const double default_h = 1e-2;
const double default_eps = 1e-10;

// Global Options object. Declared in Options.h.
// Options o(default_n, default_h, default_eps, default_dynamics);
// Dipole doSimulation(const Dipole& freeDipole, Event& event);
// Dipole doSimulation(const Dipole& freeDipole);

struct Minimum {
  double ptheta;
  double pphi;
  double f;
};

// Minimization functions
// void calculateMin (Dipole& freeDipole);
// double my_f (const gsl_vector* v, void* params);
Minimum calculate_min_impl(double ptheta, double pphi,
                     int num_events, double energy, double step_size);

void printUsage() {
  fprintf(stderr, "\n");

  // synopsis
  fprintf(stderr, "SYNOPSIS\n");
  fprintf(stderr, "\t./magphyxc [OPTIONS] (-i or -ss conditions | -f filename)\n");
  fprintf(stderr, "\n");

  // description
  fprintf(stderr, "DESCRIPTION\n");
  fprintf(stderr, 
          "\tmagphyxc runs a magnet simulation given initial conditions\n"
          "\tspecified by either the -ss or -f option. Events are output to\n"
          "\tevents.csv.\n"
          "\tmagphyxc can also find periodic solutions for the motion of\n"
          "\tthe free magnet by minimizing the distance between the beginning\n"
          "\tand ending positions of the simulation. Initial conditions are\n"
          "\tspecified either by -ss, -i, or -f option.\n"
          );
  fprintf(stderr, "\n");

  // options
  fprintf(stderr, "OPTIONS\n");
  fprintf(stderr, "\t-ss r theta phi pr ptheta pphi\n");
  fprintf(stderr, "\t-i ptheta pphi energy\n");
  fprintf(stderr, "\t\tInitial conditions.\n");
  fprintf(stderr, "\t-f filename.csv\n");
  fprintf(stderr, 
          "\t\tInitial conditions are found in the second line of\n"
          "\t\tfilename.csv, which is in the same format as what is\n"
          "\t\texported from MagPhyx web version.\n"
          );
  fprintf(stderr, "\t-o outFilename\n");
  fprintf(stderr, "\t\tFilename to output to. Default = output to stdout.\n");
  fprintf(stderr, "\t-d (bouncing | sliding)\n");
  fprintf(stderr, "\t\tDynamics type. Default = bouncing.\n");
  fprintf(stderr, "\t--numEvents n\n");
  fprintf(stderr, 
          "\t\tExecutes the simulation until n events occur. Actual number\n"
          "\t\tmay be slightly larger than --numEvents due to intermediate\n"
          "\t\tsteps for accurate collision states. Default = 1e5.\n"
          "\t\tWhen looking for periodic solutions --numEvents should be the\n"
          "\t\tnumber of bounces the free magnet should do before repeating\n"
          "\t\tits motion\n");
  fprintf(stderr, "\t--logOfNumSteps n\n");
  fprintf(stderr, 
          "\t\tExecutes the simulation for 2^n steps. Default (-1) is to\n"
          "\t\texecute for a given number of events.\n"
          "\t\tDefault = -1.\n");
  fprintf(stderr, "\t-h h\n");
  fprintf(stderr, "\t\tInitial step size. Default = 1e-2.\n");
  fprintf(stderr, "\t-e eps\n");
  fprintf(stderr, "\t\tError per step allowed. Note that this is error in\n"
          "\t\tterms of Runge-Kutta. The error in total energy will be\n"
          "\t\tsimilar to, but not bound by, this value. Default = 1e-10.\n");
  fprintf(stderr, "\t-c\n");
  fprintf(stderr, "\t\tUse a fixed step size. Default is to use an adaptive\n"
          "\t\tstep size.\n");
  fprintf(stderr, "\t-s (theta | phi | all)\n");
  fprintf(stderr, "\t\tSingle step output. Output the given state variable\n"
          "\t\t(or all state variables) at every step. Default is to output\n"
          "\t\tonly on events.\n");
  fprintf(stderr, "\t--fft\n");
  fprintf(stderr, "\t\tRun the state variable output through an fft before\n"
          "\t\toutputting. Only valid together with the -s flag.\n");
  fprintf(stderr, "\n");

  // Examples
  fprintf(stderr, "EXAMPLES\n");
  fprintf(stderr, "\t./magphyxc --numEvents 1e5 -d bouncing -ss 1.5 0 90 0 0 0 -o events.csv\n");
  fprintf(stderr, "\t./magphyxc --numEvents 4 -i 0.15 0.15 -0.05\n");
  fprintf(stderr, "\t\tDemo 7 from MagPhyx web version\n");
  fprintf(stderr, "\t./magphyxc --numEvents 1e5 -d bouncing -f init.csv -o events.csv\n");
  fprintf(stderr, "\t\tLoads initial conditions from file\n");
  fprintf(stderr, "\t./magphyxc -d sliding --logOfNumSteps 10 -s theta -ss 1 3 -18.78982612 0 0 0 -c -h 1e-2 --fft -o theta.dat\n");
  fprintf(stderr, "\t\tRuns 1024 steps of sliding case and outputs the fft\n"
          "\t\tof the theta values.\n");
  fprintf(stderr, "\n");
}

// struct f_params {
//   f_params(int param_, double* params_) {
//     param = param_;
//     for (int i = 0; i < 2; ++i) {
//       params[i] = params_[i];
//     }
//   }
//   int param;
//   double params[2];
// };

// double f(double x_, void* params_) {
//   f_params params = *((f_params*)params_);
//   double x = params.params[0];
//   double y = params.params[1];
//   if (params.param == 0) {
//     x = x_;
//   } else {
//     y = x_;
//   }
//   return x*x + 2*x*y + y*y*y;
// }

// void compute_gradient(double* p, double* grad) {
//   const double h = 0.0001;
//   for (int i = 0; i < 2; ++i) {
//     f_params fparams(i, p);
//     gsl_function F;
//     F.function = &f;
//     F.params = &fparams;
//     double result, abserr;
//     gsl_deriv_central(&F, p[i], h, &result, &abserr);
//     grad[i] = result;
//   }
// }

int main(int argc, char** argv) {
  // double p[] = { 3,3 };
  // double grad[2];
  // compute_gradient(p, grad);
  // printf("%f %f\n", grad[0], grad[1]);
  // return 0;

  // int i = 1;
  // bool stop = false;
  // while (i < argc && !stop) {
  //   stop = true;
  //   if (o.ProcessArg(i, argv)) {
  //     stop = false;
  //   }
  // }
  // if (!o.initialized) {
  //   printUsage();
  //   return 1;
  // }

  // if (o.singleSimulation == true) {
  //   Dipole freeDipole = o.dipole;
  //   Event event(o.outFilename, freeDipole, o.singleStep);
  //   doSimulation(freeDipole, event);
  // } else {
  //   /* Dipole freeDipole = o.dipole;
  //   calculateMin(freeDipole); */
  //   // -----------------------------
  //   // added if we want to just return the dist^2 function value
  //   Dipole freeDipole = o.dipole;
  //   Dipole endDipole = doSimulation(freeDipole);
  //   double dist = sqrt((endDipole.get_theta() - freeDipole.get_theta())*(endDipole.get_theta() - freeDipole.get_theta()) + 
  //                      (endDipole.get_phi() - freeDipole.get_phi())*(endDipole.get_phi() - freeDipole.get_phi()) +
  //                      (endDipole.get_pr() - freeDipole.get_pr())*(endDipole.get_pr() - freeDipole.get_pr()) +
  //                      (endDipole.get_ptheta() - freeDipole.get_ptheta())*(endDipole.get_ptheta() - freeDipole.get_ptheta()) +
  //                      (endDipole.get_pphi() - freeDipole.get_pphi())*(endDipole.get_pphi() - freeDipole.get_pphi()));
  //   FILE* file = fopen("minimums.txt", "w");
  //   fprintf(file, "%.5f\n", dist);
  //   fclose(file);
  //   // -----------------------------
  // }

  // double ptheta = -0.28;
  // double pphi = 0.17;
  double ptheta = -0.15;
  double pphi = 0.14;

  int num_events = 4;
  double energy = -0.1;
  Minimum min = calculate_min_impl(ptheta, pphi, num_events, energy, 0.00001);
  printf("ptheta: %.4f pphi: %.4f\n", ptheta, pphi);
  printf("ptheta: %.4f pphi: %.4f fval: %.4f\n", min.ptheta, min.pphi, min.f);

  return 0;
}

// void printStateHeader() {
//   printf("\n");
//   printf(" %9s %12s %12s %12s %12s %12s %12s %12s %12s %12s\n",
//          "t", "h", "r", "theta", "phi", "pr", "ptheta", "pphi", "E", "dE");
//   printf("-------------------------------------------"
//          "-------------------------------------------"
//          "--------------------------------------------\n");
// }

// void printState(const double t, const double h, const Dipole& d,
//                 const char prefix = ' ') {
//   printf("%c%9.0lf %12.6g %12.5g %12.6g %12.6g %12.6g"
//          "%12.6g %12.6g %12.6g %12.6g\n",
//          prefix, t, h,
//          d.get_r(), Physics::rad2deg(d.get_theta()),
//          Physics::rad2deg(d.get_phi()),
//          d.get_pr(), d.get_ptheta(), d.get_pphi(),
//          d.get_E(), d.get_dE());
// }

// void printProgress(const int n, const Dipole& d, const bool fired) {
//   if (!o.interactive && (n % 1000 == 0 || n >= o.numEvents) && fired) {
//     printf("\r");
//     printf("Num collisions = %-7d     dE = %-12e     \n", n, d.get_dE());
//     fflush(stdout);
//   }
// }

// bool keepGoing(const Event& event, const int n) {
//   if (o.numEvents != -1) {
//     return (event.get_n() <= o.numEvents);
//   }
//   return (n < o.numSteps);
// }

// Dipole doSimulation(const Dipole& freeDipole, Event& event) {
//   const double h_ = o.h;
//   const int numEvents = o.numEvents;
//   const int numSteps = o.numSteps;

//   Stepper stepper(freeDipole, h_, o.fixed_h, o.eps);

//   double t = 0.0;
//   int n = 0;
//   const bool showProgress = (o.outFilename != "" &&
//                              o.singleStep == Options::NONE);

//   printf("\n");
//   event.printHeader();
//   if (o.interactive) {
//     printStateHeader();
//     printState(0, h_, freeDipole);
//   }
//   if (showProgress) {
//     printProgress(0, freeDipole, true);
//   }

//   while (keepGoing(event, n)) {
//     try {
//       stepper.step();
//     } catch (logic_error& e) {
//       printState(stepper.t, stepper.h, stepper.d);
//       throw e;
//     }

//     if (o.interactive) {
//       printState(stepper.t, stepper.h, stepper.d);
//       cin.get();
//     }

//     // Keep theta and phi in the range [-180, 180]
//     stepper.d.set_theta(Physics::normalizeAngle(stepper.d.get_theta()));
//     stepper.d.set_phi(Physics::normalizeAngle(stepper.d.get_phi()));
//     if (stepper.d.get_r() < 1) {
//       // Handle collision. Iterate until we get close enough to reflect.
//       stepper.undo();
//       while (stepper.d.get_r() > 1.0000000000001) {
//         stepper.stepHalf();
//         if (stepper.d.get_r() < 1) {
//           stepper.undo();
//         } else {
//           event.log(stepper.d, stepper.t);
//           ++n;
//         }
//       }

//       event.logCollision(stepper.d, stepper.t);
//       if (showProgress) {
//         printProgress(event.get_n(), stepper.d, true);
//       }
//       // Specular reflection
//       stepper.d.set_pr(-stepper.d.get_pr());

//       stepper.reset();
//     } else {
//       const bool fired = event.log(stepper.d, stepper.t);
//       if (showProgress) {
//         printProgress(event.get_n(), stepper.d, fired);
//       }
//       ++n;
//     }
//   }

//   printf("\n");
//   // printStateHeader();
//   // printState(0, h_, freeDipole);
//   // printState(stepper.t, stepper.h, stepper.d);

//   printf("\n");
//   if (o.outFilename != "") {
//     printf("Results output to %s\n", o.outFilename.c_str());
//     printf("\n");
//   }
//   return freeDipole;
// }

// Dipole doSimulation(const Dipole& freeDipole) {
//   const double h_ = o.h;
//   const int numEvents = o.numEvents;
//   const int numSteps = o.numSteps;

//   Stepper stepper(freeDipole, h_, o.fixed_h, o.eps);
//   Dipole toReturn;

//   double t = 0.0;
//   int n = 0;
//   // int m = 0;
//   const bool showProgress = (o.outFilename != "" &&
//                              o.singleStep == Options::NONE);

//   while (n < o.numEvents) {
//     try {
//       // double currR = stepper.d.get_r();
//       stepper.step();
//       // double newR = stepper.d.get_r();
//       /* if (currR == 1.0 && newR == 1.0) {
//         throw "same r value";
//       } */
//       // ++m;
//     } catch (logic_error& e) {
//       throw e;
//     }
//     /* if (m > 100000) {
//       throw "too many steps";
//     } */

//     // Keep theta and phi in the range [-180, 180]
//     stepper.d.set_theta(Physics::normalizeAngle(stepper.d.get_theta()));
//     stepper.d.set_phi(Physics::normalizeAngle(stepper.d.get_phi()));
//     if (stepper.d.get_r() < 1) {
//       // Handle collision. Iterate until we get close enough to reflect.
//       stepper.undo();
//       while (stepper.d.get_r() > 1.0000000000001) {
//         stepper.stepHalf();
//         if (stepper.d.get_r() < 1) {
//           stepper.undo();
//         }
//       }

//       ++n;
//       // Specular reflection
//       stepper.d.set_pr(-stepper.d.get_pr());

//       toReturn = stepper.d;
//       stepper.reset();
//     }
//   }

//   // printf("m: %d\n", m);

//   return toReturn;
// }

// double my_f (const gsl_vector* v, void* params) {
//   double x, y, z, m, n;
//   Dipole toUse;

//   x = gsl_vector_get(v, 0);
//   y = gsl_vector_get(v, 1);
//   z = gsl_vector_get(v, 2);
//   m = gsl_vector_get(v, 3);

//   // -------------------------
//   double* E = (double*)params;
//   double pr = sqrt(abs(2*(*E) + (cos(y) + 3*cos(y - 2*x))/(6*1*1*1) - z*z/(1*1) - 10*m*m));
//   // -------------------------
//   // printf("pr: %.5f \t val: %.5f\n", pr, 2*(*E) + (cos(y) + 3*cos(y - 2*x))/(6*1*1*1) - z*z/(1*1) - 10*m*m);

//   if (2*(*E) + (cos(y) + 3*cos(y - 2*x))/(6*1*1*1) - z*z/(1*1) - 10*m*m < 0.0) {
//     exit(EXIT_FAILURE);
//   }

//   toUse.set_r(1);
//   toUse.set_theta(x);
//   toUse.set_phi(y);
//   toUse.set_pr(pr);
//   toUse.set_ptheta(z);
//   toUse.set_pphi(m);

//   Dipole endDipole = doSimulation(toUse);

//   return (x - endDipole.get_theta())*(x - endDipole.get_theta()) + 
//          (y - endDipole.get_phi())*(y - endDipole.get_phi()) + 
//          (pr - endDipole.get_pr())*(pr - endDipole.get_pr()) + 
//          (z - endDipole.get_ptheta())*(z - endDipole.get_ptheta()) +
//          (m - endDipole.get_pphi())*(m - endDipole.get_pphi());
// }

// void calculateMin (Dipole& freeDipole) {
//   unsigned int iter = 0;
//   int status;

//   const gsl_multimin_fminimizer_type *T;
//   gsl_multimin_fminimizer *s;

//   gsl_vector *x;
//   gsl_vector *simplex_step;
//   gsl_multimin_function my_func;
//   double size;

//   my_func.n = 4;
//   my_func.f = my_f;
//   // -----------------------
//   double param = freeDipole.get_E();
//   my_func.params = &param;
//   // -----------------------

//   x = gsl_vector_alloc(4);
//   gsl_vector_set(x, 0, freeDipole.get_theta());
//   gsl_vector_set(x, 1, freeDipole.get_phi());
//   gsl_vector_set(x, 2, freeDipole.get_ptheta());
//   gsl_vector_set(x, 3, freeDipole.get_pphi());
  

//   T = gsl_multimin_fminimizer_nmsimplex2;
//   s = gsl_multimin_fminimizer_alloc (T, 4);

//   simplex_step = gsl_vector_alloc (4);
//   gsl_vector_set(simplex_step, 0, 0.001);
//   gsl_vector_set(simplex_step, 1, 0.001);
//   gsl_vector_set(simplex_step, 2, 0.001);
//   gsl_vector_set(simplex_step, 3, 0.001);
//   gsl_multimin_fminimizer_set(s, &my_func, x, simplex_step);

//   FILE* file = fopen("minimums.txt", "w");

//   do {
//     iter++;
//     status = gsl_multimin_fminimizer_iterate(s);

//     // printf ("error: %s\n", gsl_strerror (status));

//     if (status)
//       break;

//     size = gsl_multimin_fminimizer_size(s);
//     status = gsl_multimin_test_size(size, 1e-7);

//     if (status == GSL_SUCCESS) {
//       /* printf ("\nMinimum found at:\n");
//       printf ("%5d %.5f %.5f %.5f %.5f %.5f %10.10f\n", iter,
//         Physics::rad2deg(gsl_vector_get (s->x, 0)),
//         Physics::rad2deg(gsl_vector_get (s->x, 1)),
//         sqrt(2*param + (cos(gsl_vector_get (s->x, 1)) + 3*cos(gsl_vector_get (s->x, 1) - 2*gsl_vector_get (s->x, 0)))/(6*1*1*1) - gsl_vector_get (s->x, 2)*gsl_vector_get (s->x, 2)/(1*1) - 10*gsl_vector_get (s->x, 3)*gsl_vector_get (s->x, 3)),
//         gsl_vector_get (s->x, 2),
//         gsl_vector_get (s->x, 3),
//         s->fval); */
//     }

//       /* printf ("%5d %.5f %.5f %.5f %.5f %.5f %10.10f\n", iter,
//         Physics::rad2deg(gsl_vector_get (s->x, 0)),
//         Physics::rad2deg(gsl_vector_get (s->x, 1)),
//         sqrt(2*param + (cos(gsl_vector_get (s->x, 1)) + 3*cos(gsl_vector_get (s->x, 1) - 2*gsl_vector_get (s->x, 0)))/(6*1*1*1) - gsl_vector_get (s->x, 2)*gsl_vector_get (s->x, 2)/(1*1) - 10*gsl_vector_get (s->x, 3)*gsl_vector_get (s->x, 3)),
//         gsl_vector_get (s->x, 2),
//         gsl_vector_get (s->x, 3),
//         s->fval); */

//       double theta = Physics::rad2deg(gsl_vector_get (s->x, 0));
//       double phi = Physics::rad2deg(gsl_vector_get (s->x, 1));
//       double pr = sqrt(2*param + (cos(gsl_vector_get (s->x, 1)) + 3*cos(gsl_vector_get (s->x, 1) - 2*gsl_vector_get (s->x, 0)))/(6*1*1*1) - gsl_vector_get (s->x, 2)*gsl_vector_get (s->x, 2)/(1*1) - 10*gsl_vector_get (s->x, 3)*gsl_vector_get (s->x, 3));
//       double ptheta = gsl_vector_get (s->x, 2);
//       double pphi = gsl_vector_get (s->x, 3);

//       double values[5] = { theta, phi, pr, ptheta, pphi };

//       for (int i = 0; i < 5; i++) {
//         if (abs(values[i] - 0.0) <= 0.0001) {
//           values[i] = 0.0;
//         }
//       }

//       fprintf(file, "%d %.4f %.4f %.4f %.4f %.4f %.5f\n", 
//           1,
//           values[0],
//           values[1],
//           values[2],
//           values[3],
//           values[4],
//           s->fval);

//   } while (status == GSL_CONTINUE && iter < 1000);

//   /* double theta = Physics::rad2deg(gsl_vector_get (s->x, 0));
//   double phi = Physics::rad2deg(gsl_vector_get (s->x, 1));
//   double pr = sqrt(2*param + (cos(gsl_vector_get (s->x, 1)) + 3*cos(gsl_vector_get (s->x, 1) - 2*gsl_vector_get (s->x, 0)))/(6*1*1*1) - gsl_vector_get (s->x, 2)*gsl_vector_get (s->x, 2)/(1*1) - 10*gsl_vector_get (s->x, 3)*gsl_vector_get (s->x, 3));
//   double ptheta = gsl_vector_get (s->x, 2);
//   double pphi = gsl_vector_get (s->x, 3);

//   double values[5] = { theta, phi, pr, ptheta, pphi };

//   for (int i = 0; i < 5; i++) {
//     if (abs(values[i] - 0.0) <= 0.0001) {
//       values[i] = 0.0;
//     }
//   } */

//   // FILE* file = fopen("minimums.txt", "w");
//   // fprintf(file, "r, theta, phi, pr, ptheta, pphi, fval\n");
//   /* fprintf(file, "%d %.4f %.4f %.4f %.4f %.4f %.5f\n", 
//           1,
//           values[0],
//           values[1],
//           values[2],
//           values[3],
//           values[4],
//           s->fval); */
//   fclose(file);
//   file = fopen("iters.txt", "w");
//   fprintf(file, "%d\n", iter);
//   fclose(file);

//   gsl_multimin_fminimizer_free (s);
//   gsl_vector_free (x);
// }
