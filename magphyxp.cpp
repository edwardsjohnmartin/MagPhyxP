#include "./Minimum.h"
// struct Minimum {
//   double ptheta;
//   double pphi;
//   double energy;
//   double f;
// };

// #define VARY_PTHETA_PPHI 0
// #define VARY_PTHETA_ENERGY 1

double period_impl(double ptheta, double pphi, int num_events, double energy);
Minimum calculate_min_impl(double ptheta, double pphi, int num_events, double energy, double step_size, int vary);

double period(double ptheta, double pphi, int num_events, double energy) {
  return period_impl(ptheta, pphi, num_events, energy);
  // return 13;
}

Minimum calculate_min(double ptheta, double pphi,
                      int num_events, double energy, double step_size,
                      int vary) {
  return calculate_min_impl(ptheta, pphi, num_events, energy, step_size,
                            vary);
}
