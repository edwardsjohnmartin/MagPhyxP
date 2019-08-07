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
#include "./Minimum.h"

using namespace std;

const Options::Dynamics default_dynamics = Options::BOUNCING;
const double default_n = 1e5;
const double default_h = 1e-2;
const double default_eps = 1e-10;

// Global Options object. Declared in Options.h.
// Options o(default_n, default_h, default_eps, default_dynamics);
// Dipole doSimulation(const Dipole& freeDipole, Event& event);
// Dipole doSimulation(const Dipole& freeDipole);

// struct Minimum {
//   double ptheta;
//   double pphi;
//   double energy;
//   double f;
//   double t;
// };

// Minimization functions
// void calculateMin (Dipole& freeDipole);
// double my_f (const gsl_vector* v, void* params);
Minimum calculate_min_impl(double ptheta, double pphi,
                     int num_events, double energy, double step_size, int vary, double h);
double period_impl(double ptheta, double pphi, int num_events, double energy);

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







//------------------------------------------------------------
// Command-line usage:
//    magphyxp num_bounces ptheta pphi energy
//------------------------------------------------------------
int main(int argc, char** argv) {
  if (argc < 4) {
    printf("usage: num_bounces magphyxp ptheta pphi energy\n");
    return -1;
  }

  int i = 1;
  int num_bounces = atof(argv[i++]);
  double ptheta = atof(argv[i++]);
  double pphi = atof(argv[i++]);
  double energy = atof(argv[i++]);

  // double h = 0.005;
  // double h = 1e-7;
  // int num_events = 10;

  double min_step_size = 1e-7;
  double sim_step_size = 1e-7;
  printf("Calculating min\n");
  // Minimum min = calculate_min_impl(ptheta, pphi, num_bounces, energy,
  //                                  min_step_size,
  //                                  VARY_PTHETA_PPHI, sim_step_size);
  Minimum min = calculate_min_impl(ptheta, pphi, num_bounces, energy,
                                   min_step_size,
                                   VARY_PTHETA_ENERGY, sim_step_size);
  printf("ptheta: %.18f\npphi: %.18f\nenergy: %.18f\nfval: %.18f\n\
ptheta_rocking: %d\npphi_rocking: %d\nphase: %d\n",
         min.ptheta, min.pphi, min.energy, min.f, min.ptheta_rocking_number,
         min.pphi_rocking_number, min.rocking_in_phase);

  return 0;
}
